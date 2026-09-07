import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { ISalesHistoryRepository } from '../../../domain/repositories/ISalesHistoryRepository';
import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../domain/repositories/IDeliveryHistoryRepository';
import { ISupplierWeightConfigRepository } from '../../../domain/repositories/ISupplierWeightConfigRepository';
import { IAIForecastClient } from '../../ports/IAIForecastClient';
import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { IAbcXyzAnalysisRepository } from '../../../domain/repositories/IAbcXyzAnalysisRepository';
import { IPurchaseRecommendationRepository } from '../../../domain/repositories/IPurchaseRecommendationRepository';
import { IColdStartRepository } from '../../../domain/repositories/IColdStartRepository';

import { ABCXYZClassifier } from '../../../domain/services/ABCXYZClassifier';
import { DemandForecastingService } from '../../../domain/services/DemandForecastingService';
import { InventoryCalculator } from '../../../domain/services/InventoryCalculator';
import {

  SupplierScoringService,
  SupplierPerformanceMetrics,
  SupplierScoringBenchmark,
} from '../../../domain/services/SupplierScoringService';
import { PurchaseRecommendationService, SupplierOption } from '../../../domain/services/PurchaseRecommendationService';
import { WeightDistribution } from '../../../domain/value-objects/WeightDistribution';
import { RunAnalysisResultDTO } from '../../dtos/RecommendationDTO';

export class RunDssAnalysisUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly salesHistoryRepository: ISalesHistoryRepository,
    private readonly supplierRepository: ISupplierRepository,
    private readonly deliveryHistoryRepository: IDeliveryHistoryRepository,
    private readonly supplierWeightConfigRepository: ISupplierWeightConfigRepository,
    private readonly aiForecastClient: IAIForecastClient,
    private readonly demandForecastRepository: IDemandForecastRepository,
    private readonly abcXyzAnalysisRepository: IAbcXyzAnalysisRepository,
    private readonly recommendationRepository: IPurchaseRecommendationRepository,
    private readonly coldStartRepository: IColdStartRepository
  ) {}

  public async execute(): Promise<RunAnalysisResultDTO> {
    const startTime = Date.now();

    // 1. Lấy danh sách sản phẩm đang hoạt động (BR-021)
    const { products } = await this.productRepository.findAll({ isActive: true, limit: 1000 });
    if (!products || products.length === 0) {
      return {
        executionTimeMs: Date.now() - startTime,
        skusAnalyzed: 0,
        recommendationsCount: 0,
        message: 'Không có sản phẩm đang hoạt động để phân tích.',
      };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // =========================================================================
    // GIAI ĐOẠN 1: Phân Loại Ma Trận ABC-XYZ (BR-009, BR-010, BR-011)
    // =========================================================================
    const salesStats = await this.salesHistoryRepository.getAll30DaysSalesStats();
    const statsMap = new Map(salesStats.map((s) => [s.productSku, s]));

    // Phân loại ABC theo doanh thu
    const abcInput = products.map((p) => ({
      id: p.sku.value,
      revenue: statsMap.get(p.sku.value)?.totalRevenue || 0,
    }));
    const abcClassMap = ABCXYZClassifier.classifyABC(abcInput);

    // Tính tổng doanh thu toàn cửa hàng để tính % doanh thu
    const totalRevenueAll = abcInput.reduce((sum, item) => sum + Math.max(0, item.revenue), 0);
    const sortedByRevenue = [...abcInput].sort((a, b) => b.revenue - a.revenue);

    let cumulativeRevenue = 0;
    const abcXyzRecords: any[] = [];
    const skuClassificationMap = new Map<string, { abc: 'A' | 'B' | 'C'; xyz: 'X' | 'Y' | 'Z'; segment: string; cv: number; stdDev: number }>();

    for (const item of sortedByRevenue) {
      const itemRevenue = Math.max(0, item.revenue);
      cumulativeRevenue += itemRevenue;
      const revenuePct = totalRevenueAll > 0 ? (itemRevenue / totalRevenueAll) * 100 : 0;
      const cumulativeRevenuePct = totalRevenueAll > 0 ? (cumulativeRevenue / totalRevenueAll) * 100 : 0;

      const abcClass = abcClassMap.get(item.id) || 'C';
      const stat = statsMap.get(item.id);
      const mean = stat ? stat.meanDailyQuantity : 0;
      const stdDev = stat ? stat.stdDevDailyQuantity : 0;

      const xyzClass = ABCXYZClassifier.classifyXYZ(stdDev, mean);
      const segment = ABCXYZClassifier.getMatrixCategory(abcClass, xyzClass);
      const cv = mean > 0 ? stdDev / mean : 0;

      skuClassificationMap.set(item.id, { abc: abcClass, xyz: xyzClass, segment, cv, stdDev });

      abcXyzRecords.push({
        productSku: item.id,
        analysisDate: today,
        windowDays: 30,
        totalRevenue: Math.round(itemRevenue * 100) / 100,
        revenuePct: Math.round(revenuePct * 10) / 10,
        cumulativeRevenuePct: Math.round(cumulativeRevenuePct * 10) / 10,
        abcClass,
        dailySalesMean: Math.round(mean * 100) / 100,
        dailySalesStdDev: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: Math.round(cv * 1000) / 1000,
        xyzClass,
        abcXyzSegment: segment,
      });
    }

    await this.abcXyzAnalysisRepository.saveBatch(abcXyzRecords);

    // =========================================================================
    // GIAI ĐOẠN 2: Dự Báo Nhu Cầu AI & Fallback (BR-006, BR-007, BR-008)
    // =========================================================================
    const skuForecastMap = new Map<string, { forecastedDemand: number; dailyAvgDemand: number }>();
    const horizonDays = 14;

    for (const p of products) {
      const skuStr = p.sku.value;
      const salesAggregates = await this.salesHistoryRepository.getDailyAggregates(skuStr, 30);
      const salesHistoryFormatted = salesAggregates.map((s) => ({
        date: s.date instanceof Date ? s.date.toISOString().split('T')[0] : String(s.date),
        quantity: s.quantity,
      }));

      const coldStart = await this.coldStartRepository.findBySku(skuStr);

      let forecastResult;
      try {
        // Gửi sang AI Service
        const aiResponse = await this.aiForecastClient.getForecast({
          sku: skuStr,
          horizonDays,
          salesHistory: salesHistoryFormatted,
          expectedDailySales: coldStart?.expectedDailySales || null,
        });

        // Kiểm tra Fallback SMA-7 nếu WAPE > 40%
        forecastResult = DemandForecastingService.evaluateAndFallback(
          aiResponse,
          skuStr,
          horizonDays,
          salesHistoryFormatted
        );
      } catch {
        // Fallback nội bộ SMA-7 nếu AI crash hoặc timeout
        forecastResult = DemandForecastingService.calculateSMA7Fallback(
          skuStr,
          horizonDays,
          salesHistoryFormatted
        );
      }

      // Lưu kết quả dự báo
      await this.demandForecastRepository.saveForecast({
        productSku: skuStr,
        forecastDate: today,
        horizonDays,
        forecastedDemand: forecastResult.forecastedDemand,
        dailyAvgDemand: forecastResult.dailyAvgDemand,
        wape: forecastResult.wape,
        mae: forecastResult.mae,
        algorithmUsed: forecastResult.algorithmUsed,
        isFallback: forecastResult.isFallback,
        forecastPoints: forecastResult.points,
      });

      skuForecastMap.set(skuStr, {
        forecastedDemand: forecastResult.forecastedDemand,
        dailyAvgDemand: forecastResult.dailyAvgDemand,
      });
    }

    // =========================================================================
    // GIAI ĐOẠN 3: Tính Toán Chỉ Số Tồn Kho & 5 Mức Rủi Ro (BR-001 -> BR-005, BR-023)
    // =========================================================================
    const { inventories } = await this.inventoryRepository.findAll({ limit: 1000 });
    const inventoryMap = new Map(inventories.map((inv) => [inv.productSku, inv]));

    const dssInventoryUpdates: Array<{
      productSku: string;
      safetyStock: number;
      reorderPoint: number;
      maxStock: number;
      daysOfSupply: number;
      riskLevel: string;
      isDeadStock: boolean;
    }> = [];

    for (const p of products) {
      const skuStr = p.sku.value;
      const inv = inventoryMap.get(skuStr);
      const onHand = inv ? inv.onHand : 0;
      const onOrder = inv ? inv.onOrder : 0;
      const ip = InventoryCalculator.calculateInventoryPosition(onHand, onOrder);

      const forecast = skuForecastMap.get(skuStr);
      const dAvg = forecast ? forecast.dailyAvgDemand : 0;
      const classInfo = skuClassificationMap.get(skuStr);
      const stdDev = classInfo ? classInfo.stdDev : 0;
      const leadTime = p.defaultLeadTime || 1;

      // BR-003: Safety Stock
      const coldStart = await this.coldStartRepository.findBySku(skuStr);
      let ss: number;
      if (coldStart && salesStats.find((s) => s.productSku === skuStr)?.historyDaysCount! < 14) {
        ss = InventoryCalculator.calculateSafetyStockColdStart(coldStart.expectedDailySales);
      } else {
        ss = InventoryCalculator.calculateSafetyStock(stdDev, leadTime, p.minSafetyStock);
      }

      // BR-004: ROP & MaxStock
      const rop = InventoryCalculator.calculateReorderPoint(dAvg, leadTime, ss);
      const maxStock = InventoryCalculator.calculateMaxStock(rop, dAvg);

      // BR-005: Days of Supply
      const dos = Math.round(InventoryCalculator.calculateDaysOfSupply(onHand, dAvg) * 10) / 10;

      // BR-023: Dead Stock
      const isDeadStock = InventoryCalculator.isDeadStock(onHand, dAvg);

      // BR-002: 5 Cấp độ rủi ro
      const riskLevel = InventoryCalculator.evaluateRiskLevel(ip, ss, rop, maxStock, onHand);

      dssInventoryUpdates.push({
        productSku: skuStr,
        safetyStock: ss,
        reorderPoint: rop,
        maxStock,
        daysOfSupply: dos,
        riskLevel: riskLevel,
        isDeadStock,
      });
    }

    await this.inventoryRepository.batchUpdateDss(dssInventoryUpdates);

    // =========================================================================
    // GIAI ĐOẠN 4 & 5: Đánh Giá NCC & Sinh Khuyến Nghị Mua Hàng (BR-012 -> BR-016)
    // =========================================================================
    // 4.1 Lấy trọng số NCC
    const weightConfig = await this.supplierWeightConfigRepository.getLatest();
    const weights = weightConfig ? weightConfig.weights : WeightDistribution.defaultWeights();

    // 4.2 Lấy bảng giá NCC và tính benchmark
    const allTerms = await this.supplierRepository.findAllProductSuppliers();
    const validPrices = allTerms.map((t) => t.purchasePrice).filter((p) => p > 0);
    const validLeadTimes = allTerms.map((t) => t.committedLeadTime).filter((lt) => lt > 0);
    const benchmark: SupplierScoringBenchmark = {
      minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
      minLeadTime: validLeadTimes.length > 0 ? Math.min(...validLeadTimes) : 0,
    };

    // Nhóm terms theo SKU
    const termsBySku = new Map<string, typeof allTerms>();
    for (const term of allTerms) {
      const list = termsBySku.get(term.productSku) || [];
      list.push(term);
      termsBySku.set(term.productSku, list);
    }

    // Xóa các khuyến nghị cũ đang chờ
    await this.recommendationRepository.clearPending();

    const recommendationBatch: any[] = [];

    // Duyệt từng SKU để đánh giá nhu cầu đặt hàng: IP <= ROP
    for (const dss of dssInventoryUpdates) {
      const inv = inventoryMap.get(dss.productSku);
      const onHand = inv ? inv.onHand : 0;
      const onOrder = inv ? inv.onOrder : 0;
      const ip = onHand + onOrder;

      // Chỉ sinh khuyến nghị khi IP <= ROP hoặc hết hàng (BR-014)
      if (ip > dss.reorderPoint && onHand > 0) {
        continue;
      }

      const forecast = skuForecastMap.get(dss.productSku);
      const forecastedDemand = forecast ? forecast.forecastedDemand : 0;
      const dAvg = forecast ? forecast.dailyAvgDemand : 0;

      // Lấy danh sách NCC cung cấp sản phẩm này
      const availableTerms = termsBySku.get(dss.productSku) || [];
      const supplierOptions: SupplierOption[] = [];

      for (const term of availableTerms) {
        const sup = await this.supplierRepository.findById(term.supplierId);
        if (!sup || !sup.isActive) continue;

        // Lấy lịch sử giao hàng
        const deliveries = await this.deliveryHistoryRepository.findRecentBySupplierId(BigInt(sup.id || 0), 10);
        const onTimeInFullCount = deliveries.filter((d) => d.isOtif).length;
        const totalOrderedQuantity = deliveries.reduce((sum, d) => sum + d.totalOrderedQuantity, 0);
        const totalDeliveredQuantity = deliveries.reduce((sum, d) => sum + d.totalDeliveredQuantity, 0);
        const totalDefectiveQuantity = deliveries.reduce((sum, d) => sum + d.totalDefectiveQuantity, 0);

        const avgLeadTime =
          deliveries.length > 0
            ? deliveries.reduce((sum, d) => sum + d.leadTimeDays, 0) / deliveries.length
            : term.committedLeadTime;

        const metrics: SupplierPerformanceMetrics = {
          totalDeliveries: deliveries.length,
          onTimeInFullCount,
          totalOrderedQuantity,
          totalDeliveredQuantity,
          totalDefectiveQuantity,
          averageLeadTimeDays: avgLeadTime,
          supplierPrice: term.purchasePrice,
        };

        const scoreResult = SupplierScoringService.calculateScores(metrics, benchmark, weights);

        supplierOptions.push({
          id: sup.id || '0',
          name: sup.name,
          scoreResult,
          averageLeadTimeDays: avgLeadTime,
          supplierPrice: term.purchasePrice,
        });
      }

      // Lấy MOQ và Pack Size từ NCC ưu tiên hoặc NCC đầu tiên
      const bestTerm = availableTerms.find((t) => t.isPreferred) || availableTerms[0];
      const moq = bestTerm ? bestTerm.moq : 1;
      const packSize = bestTerm ? bestTerm.packSize : 1;

      // Tính khuyến nghị
      const recResult = PurchaseRecommendationService.generateRecommendation(
        forecastedDemand,
        dss.safetyStock,
        ip,
        dss.reorderPoint,
        dAvg,
        moq,
        packSize,
        supplierOptions,
        todayStr
      );

      if (recResult.suggestedQuantity > 0) {
        const unitPrice = recResult.selectedSupplier ? recResult.selectedSupplier.supplierPrice : bestTerm?.purchasePrice || 0;
        const estimatedTotalCost = Math.round(recResult.suggestedQuantity * unitPrice);

        const suggestedDate = recResult.suggestedOrderDate && recResult.suggestedOrderDate !== 'N/A'
          ? new Date(recResult.suggestedOrderDate)
          : today;

        recommendationBatch.push({
          productSku: dss.productSku,
          recommendedSupplierId: recResult.selectedSupplier ? BigInt(recResult.selectedSupplier.id) : null,
          horizonDays,
          onHandAtEval: onHand,
          onOrderAtEval: onOrder,
          forecastedDemand,
          safetyStock: dss.safetyStock,
          rawShortage: recResult.rawShortage,
          suggestedQuantity: recResult.suggestedQuantity,
          suggestedOrderDate: suggestedDate,
          estimatedUnitPrice: unitPrice,
          estimatedTotalCost,
          urgencyLevel: dss.riskLevel,
          explanationSummary: recResult.insight,
          explanationFactors: {
            rawShortage: recResult.rawShortage,
            moqApplied: moq,
            packSizeApplied: packSize,
          },
          status: 'PENDING',
        });
      }
    }

    if (recommendationBatch.length > 0) {
      await this.recommendationRepository.saveBatch(recommendationBatch);
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      executionTimeMs,
      skusAnalyzed: products.length,
      recommendationsCount: recommendationBatch.length,
      message: 'Đã hoàn thành phân tích toàn bộ dữ liệu và cập nhật danh sách khuyến nghị mua hàng mới nhất.',
    };
  }
}
