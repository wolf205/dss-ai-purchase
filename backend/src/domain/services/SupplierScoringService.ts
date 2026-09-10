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

    const composite = this.calculateCompositeScore(
      priceScore,
      otifScore,
      qualityScore,
      leadTimeScore,
      metrics.totalDeliveries,
      weights
    );

    return {
      otifScore: Math.round(otifScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      priceScore: Math.round(priceScore * 100) / 100,
      leadTimeScore: Math.round(leadTimeScore * 100) / 100,
      totalScore: composite.totalScore,
      isNewSupplier: composite.isNewSupplier,
    };
  }

  /**
   * Calculates total weighted score and new supplier flag given component scores (BR-012, BR-013).
   */
  public static calculateCompositeScore(
    priceScore: number,
    otifScore: number,
    qualityScore: number,
    leadTimeScore: number,
    totalDeliveries: number,
    weights: WeightDistribution = WeightDistribution.defaultWeights()
  ): { totalScore: number; isNewSupplier: boolean } {
    let totalScore = 0;
    let isNewSupplier = false;

    if (totalDeliveries < 3) {
      // BR-013, UC-009: Nhà cung cấp mới (< 3 lần giao). Chuẩn hóa thang 100 theo tỷ lệ trọng số đã biết
      isNewSupplier = true;
      const knownWeightSum = weights.weightPrice + weights.weightLeadTime;
      totalScore = knownWeightSum > 0
        ? (weights.weightPrice * priceScore + weights.weightLeadTime * leadTimeScore) / knownWeightSum
        : (priceScore * 0.5) + (leadTimeScore * 0.5);
    } else {
      // BR-013: Tính tổng điểm với trọng số đầy đủ
      totalScore =
        weights.weightPrice * priceScore +
        weights.weightOtif * otifScore +
        weights.weightQuality * qualityScore +
        weights.weightLeadTime * leadTimeScore;
    }

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      isNewSupplier,
    };
  }

  public static calculatePriceScore(supplierPrice: number, minPrice: number): number {
    if (supplierPrice <= 0) return 100;
    if (minPrice <= 0) minPrice = supplierPrice;
    return Math.min(100, Math.max(0, (minPrice / supplierPrice) * 100));
  }

  public static calculateLeadTimeScore(supplierLeadTime: number, minLeadTime: number): number {
    if (supplierLeadTime <= 0) return 100;
    if (minLeadTime <= 0) minLeadTime = supplierLeadTime;
    return Math.min(100, Math.max(0, (minLeadTime / supplierLeadTime) * 100));
  }
}
