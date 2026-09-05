import { SupplierScoringService } from '../../../src/domain/services/SupplierScoringService';
import { WeightDistribution } from '../../../src/domain/value-objects/WeightDistribution';

describe('SupplierScoringService (BR-013, UC-009, UC-017)', () => {
  it('should return baseline 50.0 score for a new supplier with 0 deliveries', () => {
    const result = SupplierScoringService.calculateScores({
      totalDeliveries: 0,
      onTimeInFullCount: 0,
      totalOrderedQuantity: 0,
      totalDeliveredQuantity: 0,
      totalDefectiveQuantity: 0,
      averageLeadTimeDays: 0,
      committedLeadTimeDays: 2,
      priceCompetitivenessRatio: 1.0,
    });

    expect(result.isNewSupplier).toBe(true);
    expect(result.totalScore).toBe(50.0);
    expect(result.otifScore).toBe(50.0);
  });

  it('should calculate weighted score accurately for active supplier with delivery history', () => {
    // Weights: Price 35%, OTIF 25%, Quality 20%, LeadTime 20%
    const weights = new WeightDistribution(0.35, 0.25, 0.20, 0.20);
    const result = SupplierScoringService.calculateScores(
      {
        totalDeliveries: 10,
        onTimeInFullCount: 9, // OTIF = 90%
        totalOrderedQuantity: 1000,
        totalDeliveredQuantity: 1000,
        totalDefectiveQuantity: 10, // Defect rate = 1% -> Quality = 99%
        averageLeadTimeDays: 2,
        committedLeadTimeDays: 2, // Lead time score = 100%
        priceCompetitivenessRatio: 1.0, // Price score = 100%
      },
      weights
    );

    expect(result.isNewSupplier).toBe(false);
    expect(result.otifScore).toBe(90);
    expect(result.qualityScore).toBe(99);
    expect(result.priceScore).toBe(100);
    expect(result.leadTimeScore).toBe(100);

    // totalScore = 0.35 * 100 + 0.25 * 90 + 0.20 * 99 + 0.20 * 100 = 35 + 22.5 + 19.8 + 20 = 97.3
    expect(result.totalScore).toBe(97.3);
  });
});
