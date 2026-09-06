import { DemandForecastingService } from '../../../src/domain/services/DemandForecastingService';
import { DailySalesHistoryItem, ForecastResponsePayload } from '../../../src/application/dtos/ForecastDTO';

describe('DemandForecastingService', () => {
  describe('calculateSMA7Fallback', () => {
    it('should calculate SMA-7 correctly for 14 horizon days', () => {
      const sales: DailySalesHistoryItem[] = [
        { date: '2026-08-01', quantity: 10 },
        { date: '2026-08-02', quantity: 10 },
        { date: '2026-08-03', quantity: 10 },
        { date: '2026-08-04', quantity: 10 },
        { date: '2026-08-05', quantity: 10 },
        { date: '2026-08-06', quantity: 10 },
        { date: '2026-08-07', quantity: 10 }, // 7 items = SMA 10
      ];

      const result = DemandForecastingService.calculateSMA7Fallback('SKU-1', 14, sales);

      expect(result.sku).toBe('SKU-1');
      expect(result.horizonDays).toBe(14);
      expect(result.isFallback).toBe(true);
      expect(result.algorithmUsed).toBe('FALLBACK_SMA7');
      expect(result.dailyAvgDemand).toBe(10);
      expect(result.forecastedDemand).toBe(140); // 10 * 14
      expect(result.points.length).toBe(14);
      expect(result.points[0].predicted).toBe(10);
    });
  });

  describe('evaluateAndFallback', () => {
    it('should fallback if AI response is null', () => {
      const result = DemandForecastingService.evaluateAndFallback(null, 'SKU-1', 7, []);
      expect(result.isFallback).toBe(true);
      expect(result.algorithmUsed).toBe('FALLBACK_SMA7');
    });

    it('should fallback if WAPE > 40', () => {
      const aiRes: ForecastResponsePayload = {
        sku: 'SKU-1',
        horizonDays: 7,
        forecastedDemand: 100,
        dailyAvgDemand: 14.2,
        wape: 45, // > 40
        mae: 5,
        algorithmUsed: 'AI_MODEL',
        isFallback: false,
        points: []
      };

      const result = DemandForecastingService.evaluateAndFallback(aiRes, 'SKU-1', 7, []);
      expect(result.isFallback).toBe(true);
      expect(result.algorithmUsed).toBe('FALLBACK_SMA7');
    });

    it('should NOT fallback if WAPE <= 40', () => {
      const aiRes: ForecastResponsePayload = {
        sku: 'SKU-1',
        horizonDays: 7,
        forecastedDemand: 100,
        dailyAvgDemand: 14.2,
        wape: 39,
        mae: 5,
        algorithmUsed: 'AI_MODEL',
        isFallback: false,
        points: []
      };

      const result = DemandForecastingService.evaluateAndFallback(aiRes, 'SKU-1', 7, []);
      expect(result.isFallback).toBe(false);
      expect(result.algorithmUsed).toBe('AI_MODEL');
      expect(result.wape).toBe(39);
    });
  });
});
