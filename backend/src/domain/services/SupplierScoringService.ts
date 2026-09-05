import { WeightDistribution } from '../value-objects/WeightDistribution';

export interface SupplierPerformanceMetrics {
  totalDeliveries: number;
  onTimeInFullCount: number;
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  totalDefectiveQuantity: number;
  averageLeadTimeDays: number;
  committedLeadTimeDays: number;
  priceCompetitivenessRatio: number; // Ratio of current price vs benchmark (1.0 = equal, < 1.0 = cheaper/better)
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
   * Calculates 4 criteria scores and total weighted score for a supplier (BR-013, UC-009).
   */
  public static calculateScores(
    metrics: SupplierPerformanceMetrics,
    weights: WeightDistribution = WeightDistribution.defaultWeights()
  ): SupplierScoreResult {
    if (metrics.totalDeliveries === 0) {
      // New supplier with no historical deliveries: assign baseline neutral score of 50.0
      return {
        otifScore: 50.0,
        qualityScore: 50.0,
        priceScore: 50.0,
        leadTimeScore: 50.0,
        totalScore: 50.0,
        isNewSupplier: true,
      };
    }

    // 1. OTIF Score (0 - 100%)
    const otifScore = Math.min(100, Math.max(0, (metrics.onTimeInFullCount / metrics.totalDeliveries) * 100));

    // 2. Quality Score (0 - 100%)
    let qualityScore = 100;
    if (metrics.totalDeliveredQuantity > 0) {
      const defectRate = (metrics.totalDefectiveQuantity / metrics.totalDeliveredQuantity) * 100;
      qualityScore = Math.min(100, Math.max(0, 100 - defectRate));
    }

    // 3. Price Score (0 - 100%)
    // If ratio <= 1.0 -> 100 - (ratio - 0.8) * 100, clamped [0, 100]
    let priceScore = 100;
    if (metrics.priceCompetitivenessRatio > 1.0) {
      priceScore = Math.max(0, 100 - (metrics.priceCompetitivenessRatio - 1.0) * 100);
    } else if (metrics.priceCompetitivenessRatio < 1.0) {
      priceScore = Math.min(100, 100 + (1.0 - metrics.priceCompetitivenessRatio) * 50);
    }

    // 4. Lead Time Score (0 - 100%)
    let leadTimeScore = 100;
    if (metrics.committedLeadTimeDays > 0) {
      if (metrics.averageLeadTimeDays > metrics.committedLeadTimeDays) {
        const delayPercent = ((metrics.averageLeadTimeDays - metrics.committedLeadTimeDays) / metrics.committedLeadTimeDays) * 100;
        leadTimeScore = Math.max(0, 100 - delayPercent);
      }
    }

    // Total Weighted Score (BR-013)
    const totalScore =
      weights.weightPrice * priceScore +
      weights.weightOtif * otifScore +
      weights.weightQuality * qualityScore +
      weights.weightLeadTime * leadTimeScore;

    return {
      otifScore: Math.round(otifScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      priceScore: Math.round(priceScore * 100) / 100,
      leadTimeScore: Math.round(leadTimeScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      isNewSupplier: false,
    };
  }
}
