import { WeightDistribution } from '../value-objects/WeightDistribution';

export interface SupplierPerformanceMetrics {
  totalDeliveries: number;
  onTimeInFullCount: number;
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  totalDefectiveQuantity: number;
  averageLeadTimeDays: number;
  supplierPrice: number;
}

export interface SupplierScoringBenchmark {
  minPrice: number;
  minLeadTime: number;
}

export interface SupplierScoreResult {
  otifScore: number;
  qualityScore: number;
  priceScore: number;
  leadTimeScore: number;
  totalScore: number;
  isNewSupplier: boolean;
}

export class SupplierScoringService {
  /**
   * Calculates 4 criteria scores and total weighted score for a supplier (BR-012, BR-013).
   */
  public static calculateScores(
    metrics: SupplierPerformanceMetrics,
    benchmark: SupplierScoringBenchmark,
    weights: WeightDistribution = WeightDistribution.defaultWeights()
  ): SupplierScoreResult {
    // 1. Tính OTIF Score
    const otifScore = metrics.totalDeliveries > 0 
      ? Math.min(100, Math.max(0, (metrics.onTimeInFullCount / metrics.totalDeliveries) * 100))
      : 50.0; // Baseline cho NCC chưa giao hàng

    // 2. Tính Quality Score
    let qualityScore = 100;
    if (metrics.totalDeliveredQuantity > 0) {
      const defectRate = (metrics.totalDefectiveQuantity / metrics.totalDeliveredQuantity) * 100;
      qualityScore = Math.min(100, Math.max(0, 100 - defectRate));
    } else if (metrics.totalDeliveries === 0) {
      qualityScore = 50.0;
    }

    // 3. Tính Price Score (BR-012)
    const priceScore = this.calculatePriceScore(metrics.supplierPrice, benchmark.minPrice);

    // 4. Tính Lead Time Score (BR-012)
    const leadTimeScore = this.calculateLeadTimeScore(metrics.averageLeadTimeDays, benchmark.minLeadTime);

    let totalScore = 0;
    let isNewSupplier = false;

    if (metrics.totalDeliveries < 3) {
      // BR-013: Nhà cung cấp mới (< 3 lần giao). Tạm thời tính điểm dựa trên Giá và Thời gian giao hàng
      isNewSupplier = true;
      // Chia lại trọng số đều cho 2 yếu tố đã biết (50% - 50%)
      totalScore = (priceScore * 0.5) + (leadTimeScore * 0.5);
    } else {
      // BR-013: Tính tổng điểm với trọng số
      totalScore =
        weights.weightPrice * priceScore +
        weights.weightOtif * otifScore +
        weights.weightQuality * qualityScore +
        weights.weightLeadTime * leadTimeScore;
    }

    return {
      otifScore: Math.round(otifScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      priceScore: Math.round(priceScore * 100) / 100,
      leadTimeScore: Math.round(leadTimeScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      isNewSupplier,
    };
  }

  private static calculatePriceScore(supplierPrice: number, minPrice: number): number {
    if (supplierPrice <= 0) return 100;
    if (minPrice <= 0) minPrice = supplierPrice;
    return Math.min(100, Math.max(0, (minPrice / supplierPrice) * 100));
  }

  private static calculateLeadTimeScore(supplierLeadTime: number, minLeadTime: number): number {
    if (supplierLeadTime <= 0) return 100;
    if (minLeadTime <= 0) minLeadTime = supplierLeadTime;
    return Math.min(100, Math.max(0, (minLeadTime / supplierLeadTime) * 100));
  }
}
