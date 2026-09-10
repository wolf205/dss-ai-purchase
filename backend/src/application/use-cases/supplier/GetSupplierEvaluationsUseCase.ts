import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../domain/repositories/IDeliveryHistoryRepository';
import { ISupplierWeightConfigRepository } from '../../../domain/repositories/ISupplierWeightConfigRepository';
import { SupplierScoringService } from '../../../domain/services/SupplierScoringService';
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
      : WeightDistribution.defaultWeights();

    // 3. Lấy toàn bộ bảng giá và điều khoản sản phẩm của NCC để tính benchmark theo từng SKU (BR-012)
    const allProductSuppliers = await this.supplierRepository.findAllProductSuppliers();

    // Nhóm terms theo productSku để tìm P_min(j) và LT_min(j) riêng cho từng SKU (BR-012)
    const minPriceBySku = new Map<string, number>();
    const minLeadTimeBySku = new Map<string, number>();

    for (const term of allProductSuppliers) {
      if (term.purchasePrice > 0) {
        const currentMinPrice = minPriceBySku.get(term.productSku);
        if (currentMinPrice === undefined || term.purchasePrice < currentMinPrice) {
          minPriceBySku.set(term.productSku, term.purchasePrice);
        }
      }
      if (term.committedLeadTime > 0) {
        const currentMinLt = minLeadTimeBySku.get(term.productSku);
        if (currentMinLt === undefined || term.committedLeadTime < currentMinLt) {
          minLeadTimeBySku.set(term.productSku, term.committedLeadTime);
        }
      }
    }

    // Nhóm ProductSupplier theo supplierId để tra cứu nhanh O(1)
    const termsBySupplier = new Map<string, typeof allProductSuppliers>();
    for (const term of allProductSuppliers) {
      const list = termsBySupplier.get(term.supplierId) || [];
      list.push(term);
      termsBySupplier.set(term.supplierId, list);
    }

    // 4. Đánh giá song song cho từng nhà cung cấp (Tối ưu I/O bằng Promise.all)
    const evaluationResults: Omit<SupplierEvaluationItemDTO, 'rank'>[] = await Promise.all(
      suppliers.map(async (supplier) => {
        const supplierIdStr = supplier.id?.toString() || '0';
        const supplierIdBigInt = BigInt(supplierIdStr);

        // Lấy tối đa 10 lần giao hàng gần nhất từ DeliveryHistory (BR-012, BR-013)
        const deliveries = await this.deliveryHistoryRepository.findRecentBySupplierId(supplierIdBigInt, 10);

        const supplierTerms = termsBySupplier.get(supplierIdStr) || [];

        // 4.1. Điểm Giá S_price(i) = (1/M) * SUM( P_min(j) / P_supplier(i, j) * 100 ) (BR-012)
        const validPriceTerms = supplierTerms.filter((t) => t.purchasePrice > 0);
        let priceScore = 100;
        if (validPriceTerms.length > 0) {
          const skuPriceScores = validPriceTerms.map((t) => {
            const minPrice = minPriceBySku.get(t.productSku) ?? t.purchasePrice;
            return SupplierScoringService.calculatePriceScore(t.purchasePrice, minPrice);
          });
          priceScore = skuPriceScores.reduce((sum, s) => sum + s, 0) / skuPriceScores.length;
        }

        // 4.2. Điểm Lead Time S_leadtime(i) = (1/M) * SUM( LT_min(j) / LT_supplier(i, j) * 100 ) (BR-012)
        const validLeadTimeTerms = supplierTerms.filter((t) => t.committedLeadTime > 0);
        let leadTimeScore = 100;
        if (validLeadTimeTerms.length > 0) {
          const skuLtScores = validLeadTimeTerms.map((t) => {
            const minLt = minLeadTimeBySku.get(t.productSku) ?? t.committedLeadTime;
            return SupplierScoringService.calculateLeadTimeScore(t.committedLeadTime, minLt);
          });
          leadTimeScore = skuLtScores.reduce((sum, s) => sum + s, 0) / skuLtScores.length;
        }

        // 4.3. Điểm OTIF và Chất lượng từ lịch sử nhận hàng
        const totalDeliveries = deliveries.length;
        const onTimeInFullCount = deliveries.filter((d) => d.isOtif).length;
        const totalDeliveredQuantity = deliveries.reduce((sum, d) => sum + d.totalDeliveredQuantity, 0);
        const totalDefectiveQuantity = deliveries.reduce((sum, d) => sum + d.totalDefectiveQuantity, 0);

        const otifScore = totalDeliveries > 0
          ? Math.min(100, Math.max(0, (onTimeInFullCount / totalDeliveries) * 100))
          : 50.0; // Baseline cho NCC chưa có lần giao

        let qualityScore = 100;
        if (totalDeliveredQuantity > 0) {
          const defectRate = (totalDefectiveQuantity / totalDeliveredQuantity) * 100;
          qualityScore = Math.min(100, Math.max(0, 100 - defectRate));
        } else if (totalDeliveries === 0) {
          qualityScore = 50.0;
        }

        // 4.4. Tính điểm tổng hợp và cờ NEW_SUPPLIER (BR-013)
        const composite = SupplierScoringService.calculateCompositeScore(
          priceScore,
          otifScore,
          qualityScore,
          leadTimeScore,
          totalDeliveries,
          weights
        );

        return {
          supplierId: Number(supplier.id) || 0,
          supplierCode: supplier.code,
          supplierName: supplier.name,
          deliveryCountAnalyzed: totalDeliveries,
          totalScore: composite.totalScore,
          isNewSupplier: composite.isNewSupplier,
          scores: {
            priceScore: Math.round(priceScore * 100) / 100,
            otifScore: Math.round(otifScore * 100) / 100,
            qualityScore: Math.round(qualityScore * 100) / 100,
            leadTimeScore: Math.round(leadTimeScore * 100) / 100,
          },
        };
      })
    );

    // 5. Sắp xếp danh sách theo totalScore giảm dần và gán rank 1, 2, 3... (UC-009)
    evaluationResults.sort((a, b) => b.totalScore - a.totalScore);

    const rankedResults: SupplierEvaluationItemDTO[] = evaluationResults.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return rankedResults;
  }
}
