import { SupplierScoringService, SupplierPerformanceMetrics, SupplierScoringBenchmark } from '../../../src/domain/services/SupplierScoringService';
import { WeightDistribution } from '../../../src/domain/value-objects/WeightDistribution';

describe('SupplierScoringService', () => {
  const benchmark: SupplierScoringBenchmark = {
    minPrice: 10,
    minLeadTime: 2,
  };

  const defaultWeights = WeightDistribution.defaultWeights();

  describe('calculateScores (BR-012, BR-013)', () => {
    it('should calculate scores for a perfect supplier', () => {
      const metrics: SupplierPerformanceMetrics = {
        totalDeliveries: 10,
        onTimeInFullCount: 10,
        totalOrderedQuantity: 100,
        totalDeliveredQuantity: 100,
        totalDefectiveQuantity: 0,
        averageLeadTimeDays: 2,
        supplierPrice: 10,
      };

      const result = SupplierScoringService.calculateScores(metrics, benchmark, defaultWeights);

      expect(result.otifScore).toBe(100);
      expect(result.qualityScore).toBe(100);
      expect(result.priceScore).toBe(100);
      expect(result.leadTimeScore).toBe(100);
      expect(result.totalScore).toBe(100);
      expect(result.isNewSupplier).toBe(false);
    });

    it('should penalize otif, quality, price, and lead time correctly', () => {
      const metrics: SupplierPerformanceMetrics = {
        totalDeliveries: 10,
        onTimeInFullCount: 7, // 70% OTIF
        totalOrderedQuantity: 100,
        totalDeliveredQuantity: 100,
        totalDefectiveQuantity: 15, // 85% Quality
        averageLeadTimeDays: 4, // min is 2 -> (2/4) * 100 = 50% LeadTime
        supplierPrice: 12.5, // min is 10 -> (10/12.5) * 100 = 80% Price
      };

      const result = SupplierScoringService.calculateScores(metrics, benchmark, defaultWeights);

      expect(result.otifScore).toBe(70);
      expect(result.qualityScore).toBe(85);
      expect(result.priceScore).toBe(80);
      expect(result.leadTimeScore).toBe(50);
      
      // Default weights: OTIF 25%, Quality 20%, Price 35%, LeadTime 20%
      // Total = 0.25*70 + 0.2*85 + 0.35*80 + 0.2*50 = 17.5 + 17 + 28 + 10 = 72.5
      expect(result.totalScore).toBe(72.5);
      expect(result.isNewSupplier).toBe(false);
    });

    it('should calculate for NEW_SUPPLIER (< 3 deliveries)', () => {
      const metrics: SupplierPerformanceMetrics = {
        totalDeliveries: 2,
        onTimeInFullCount: 2,
        totalOrderedQuantity: 20,
        totalDeliveredQuantity: 20,
        totalDefectiveQuantity: 0,
        averageLeadTimeDays: 4, // 50% LeadTime
        supplierPrice: 12.5, // 80% Price
      };

      const result = SupplierScoringService.calculateScores(metrics, benchmark, defaultWeights);

      // Should be 100% for OTIF and Quality as baseline because 2/2 is 100% and 0 defects is 100%
      expect(result.otifScore).toBe(100);
      expect(result.qualityScore).toBe(100);
      
      expect(result.priceScore).toBe(80);
      expect(result.leadTimeScore).toBe(50);
      expect(result.isNewSupplier).toBe(true);
      
      // Total score for NEW_SUPPLIER should be evenly distributed for known metrics (Price & LeadTime)
      // 0.5 * 80 + 0.5 * 50 = 40 + 25 = 65
      expect(result.totalScore).toBe(65);
    });

    it('should handle zero price and lead time gracefully', () => {
      const metrics: SupplierPerformanceMetrics = {
        totalDeliveries: 10,
        onTimeInFullCount: 10,
        totalOrderedQuantity: 100,
        totalDeliveredQuantity: 100,
        totalDefectiveQuantity: 0,
        averageLeadTimeDays: 0, // Should cap at 100
        supplierPrice: 0, // Should cap at 100
      };

      const result = SupplierScoringService.calculateScores(metrics, { minPrice: 0, minLeadTime: 0 }, defaultWeights);

      expect(result.priceScore).toBe(100);
      expect(result.leadTimeScore).toBe(100);
    });
  });
});
