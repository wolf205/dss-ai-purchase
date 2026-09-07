import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../domain/repositories/IDeliveryHistoryRepository';
import { ISupplierWeightConfigRepository } from '../../../domain/repositories/ISupplierWeightConfigRepository';
import {
  SupplierScoringService,
  SupplierPerformanceMetrics,
  SupplierScoringBenchmark,
} from '../../../domain/services/SupplierScoringService';
import { WeightDistribution } from '../../../domain/value-objects/WeightDistribution';
import { SupplierEvaluationItemDTO } from '../../dtos/SupplierDTO';

export class GetSupplierEvaluationsUseCase {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly deliveryHistoryRepository: IDeliveryHistoryRepository,
    private readonly supplierWeightConfigRepository: ISupplierWeightConfigRepository
  ) {}

  public async execute(): Promise<SupplierEvaluationItemDTO[]> {
    // 1. Lấy toàn bộ danh sách nhà cung cấp đang hoạt động (BR-021)
    const { suppliers } = await this.supplierRepository.findAll({ isActive: true });
    if (!suppliers || suppliers.length === 0) {
      return [];
    }

    // 2. Lấy cấu hình trọng số hệ thống (hoặc dùng trọng số chuẩn BR-013)
    const weightConfig = await this.supplierWeightConfigRepository.getLatest();
    const weights = weightConfig
      ? weightConfig.weights
      : new WeightDistribution(20, 35, 30, 15);

    // 3. Lấy toàn bộ bảng giá và điều khoản sản phẩm của NCC để tính benchmark
    const allProductSuppliers = await this.supplierRepository.findAllProductSuppliers();

    // Tìm minPrice và minLeadTime trên toàn hệ thống làm Benchmark (BR-012)
    const validPrices = allProductSuppliers.map((p) => p.purchasePrice).filter((p) => p > 0);
    const validLeadTimes = allProductSuppliers.map((p) => p.committedLeadTime).filter((lt) => lt > 0);

    const benchmark: SupplierScoringBenchmark = {
      minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
      minLeadTime: validLeadTimes.length > 0 ? Math.min(...validLeadTimes) : 0,
    };

    // Nhóm ProductSupplier theo supplierId để tra cứu nhanh O(1)
    const termsBySupplier = new Map<string, typeof allProductSuppliers>();
    for (const term of allProductSuppliers) {
      const list = termsBySupplier.get(term.supplierId) || [];
      list.push(term);
      termsBySupplier.set(term.supplierId, list);
    }

    // 4. Đánh giá cho từng nhà cung cấp
    const evaluationResults: Omit<SupplierEvaluationItemDTO, 'rank'>[] = [];

    for (const supplier of suppliers) {
      const supplierIdStr = supplier.id?.toString() || '0';
      const supplierIdBigInt = BigInt(supplierIdStr);

      // Lấy tối đa 10 lần giao hàng gần nhất từ DeliveryHistory (BR-012, BR-013)
      const deliveries = await this.deliveryHistoryRepository.findRecentBySupplierId(supplierIdBigInt, 10);

      const supplierTerms = termsBySupplier.get(supplierIdStr) || [];
      const supplierPrices = supplierTerms.map((t) => t.purchasePrice).filter((p) => p > 0);
      const supplierLeadTimes = supplierTerms.map((t) => t.committedLeadTime).filter((lt) => lt > 0);

      const avgSupplierPrice = supplierPrices.length > 0
        ? supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length
        : 0;

      const avgSupplierCommittedLeadTime = supplierLeadTimes.length > 0
        ? supplierLeadTimes.reduce((a, b) => a + b, 0) / supplierLeadTimes.length
        : 0;

      // Tính metrics từ lịch sử giao hàng
      const totalDeliveries = deliveries.length;
      const onTimeInFullCount = deliveries.filter((d) => d.isOtif).length;
      const totalOrderedQuantity = deliveries.reduce((sum, d) => sum + d.totalOrderedQuantity, 0);
      const totalDeliveredQuantity = deliveries.reduce((sum, d) => sum + d.totalDeliveredQuantity, 0);
      const totalDefectiveQuantity = deliveries.reduce((sum, d) => sum + d.totalDefectiveQuantity, 0);

      const avgDeliveryLeadTime = totalDeliveries > 0
        ? deliveries.reduce((sum, d) => sum + d.leadTimeDays, 0) / totalDeliveries
        : avgSupplierCommittedLeadTime;

      const metrics: SupplierPerformanceMetrics = {
        totalDeliveries,
        onTimeInFullCount,
        totalOrderedQuantity,
        totalDeliveredQuantity,
        totalDefectiveQuantity,
        averageLeadTimeDays: avgDeliveryLeadTime,
        supplierPrice: avgSupplierPrice,
      };

      const scoreResult = SupplierScoringService.calculateScores(metrics, benchmark, weights);

      evaluationResults.push({
        supplierId: Number(supplier.id) || 0,
        supplierCode: supplier.code,
        supplierName: supplier.name,
        deliveryCountAnalyzed: totalDeliveries,
        totalScore: scoreResult.totalScore,
        isNewSupplier: scoreResult.isNewSupplier,
        scores: {
          priceScore: scoreResult.priceScore,
          otifScore: scoreResult.otifScore,
          qualityScore: scoreResult.qualityScore,
          leadTimeScore: scoreResult.leadTimeScore,
        },
      });
    }

    // 5. Sắp xếp danh sách theo totalScore giảm dần và gán rank 1, 2, 3... (UC-009)
    evaluationResults.sort((a, b) => b.totalScore - a.totalScore);

    const rankedResults: SupplierEvaluationItemDTO[] = evaluationResults.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return rankedResults;
  }
}
