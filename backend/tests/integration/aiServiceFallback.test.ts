import { DemandForecastingService } from '../../src/domain/services/DemandForecastingService';
import { AxiosAIForecastClient } from '../../src/infrastructure/external-services/AxiosAIForecastClient';
import { DailySalesRecord } from '../../src/domain/types/ForecastTypes';

describe('AI Service Fallback & Graceful Degradation Integration Tests (BR-006, BR-007, NFR-04)', () => {
  const testSku = 'MILK-VNM-180';
  const horizonDays = 14;

  const mockSalesHistory: DailySalesRecord[] = [
    { date: '2026-08-25', quantity: 20 },
    { date: '2026-08-26', quantity: 22 },
    { date: '2026-08-27', quantity: 18 },
    { date: '2026-08-28', quantity: 25 },
    { date: '2026-08-29', quantity: 30 },
    { date: '2026-08-30', quantity: 35 },
    { date: '2026-08-31', quantity: 28 },
  ];

  it('Graceful Degradation: Should calculate SMA-7 fallback locally when AI Service is unreachable', async () => {
    // 1. Arrange: An AI client pointing to an offline/non-existent port
    const offlineClient = new AxiosAIForecastClient('http://127.0.0.1:59999');

    // 2. Act: Attempt to fetch forecast, catch error, and activate fallback
    let forecastResult;
    try {
      await offlineClient.getForecast({
        sku: testSku,
        horizonDays,
        salesHistory: mockSalesHistory,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch {
      // Offline detected -> Activate Fallback SMA-7 (NFR-04, BR-007)
      forecastResult = DemandForecastingService.calculateSMA7Fallback(
        testSku,
        horizonDays,
        mockSalesHistory
      );
    }

    // 3. Assert: Fallback result must be valid, safe, and flagged
    expect(forecastResult).toBeDefined();
    expect(forecastResult!.sku).toBe(testSku);
    expect(forecastResult!.isFallback).toBe(true);
    expect(forecastResult!.algorithmUsed).toBe('FALLBACK_SMA7');
    expect(forecastResult!.forecastedDemand).toBeGreaterThan(0);
    // Average of 7 days: (20+22+18+25+30+35+28)/7 = 178/7 = 25.43 -> 14 days ~ 356
    expect(forecastResult!.dailyAvgDemand).toBeCloseTo(25.43, 1);
    expect(forecastResult!.points).toHaveLength(horizonDays);
  });

  it('Quality Gate: Should trigger Fallback when AI model WAPE > 40% (BR-007)', () => {
    // 1. Arrange: An AI response with high WAPE (45.5%)
    const noisyAiResponse = {
      sku: testSku,
      horizonDays,
      forecastedDemand: 500,
      dailyAvgDemand: 35.7,
      wape: 45.5, // > 40% threshold
      mae: 12.0,
      algorithmUsed: 'AI_MODEL' as const,
      isFallback: false,
      points: [],
    };

    // 2. Act: Evaluate against BR-007
    const evaluated = DemandForecastingService.evaluateAndFallback(
      noisyAiResponse,
      testSku,
      horizonDays,
      mockSalesHistory
    );

    // 3. Assert: Automatically fell back to SMA-7
    expect(evaluated.isFallback).toBe(true);
    expect(evaluated.algorithmUsed).toBe('FALLBACK_SMA7');
    expect(evaluated.dailyAvgDemand).toBeCloseTo(25.43, 1);
  });

  it('Quality Gate: Should accept AI model result when WAPE <= 40% (BR-007)', () => {
    // 1. Arrange: An AI response with good WAPE (18.2%)
    const goodAiResponse = {
      sku: testSku,
      horizonDays,
      forecastedDemand: 360,
      dailyAvgDemand: 25.7,
      wape: 18.2, // <= 40% threshold
      mae: 4.5,
      algorithmUsed: 'AI_MODEL' as const,
      isFallback: false,
      points: [],
    };

    // 2. Act: Evaluate against BR-007
    const evaluated = DemandForecastingService.evaluateAndFallback(
      goodAiResponse,
      testSku,
      horizonDays,
      mockSalesHistory
    );

    // 3. Assert: AI model result accepted
    expect(evaluated.isFallback).toBe(false);
    expect(evaluated.algorithmUsed).toBe('AI_MODEL');
    expect(evaluated.forecastedDemand).toBe(360);
  });
});
