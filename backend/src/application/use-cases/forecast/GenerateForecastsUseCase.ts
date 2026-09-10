import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ISalesHistoryRepository } from '../../../domain/repositories/ISalesHistoryRepository';
import { IColdStartRepository } from '../../../domain/repositories/IColdStartRepository';
import { IAIForecastClient } from '../../ports/IAIForecastClient';
import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { DemandForecastingService } from '../../../domain/services/DemandForecastingService';

export interface GenerateForecastsInputDTO {
  horizonDays?: number;
}

export interface GenerateForecastsResultDTO {
  skusAnalyzed: number;
  horizonsGenerated: number[];
  executionTimeMs: number;
  message: string;
}

export class GenerateForecastsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly salesHistoryRepository: ISalesHistoryRepository,
    private readonly coldStartRepository: IColdStartRepository,
    private readonly aiForecastClient: IAIForecastClient,
    private readonly demandForecastRepository: IDemandForecastRepository
  ) {}

  public async execute(input?: GenerateForecastsInputDTO): Promise<GenerateForecastsResultDTO> {
    const startTime = Date.now();

    // Xác định các chu kỳ cần sinh (7, 14, 30 ngày hoặc theo yêu cầu)
    let targetHorizons: Array<7 | 14 | 30>;
    if (input?.horizonDays && [7, 14, 30].includes(input.horizonDays)) {
      targetHorizons = [input.horizonDays as 7 | 14 | 30];
    } else {
      targetHorizons = [7, 14, 30];
    }

    const { products } = await this.productRepository.findAll({ isActive: true, limit: 1000 });
    if (!products || products.length === 0) {
      return {
        skusAnalyzed: 0,
        horizonsGenerated: targetHorizons,
        executionTimeMs: Date.now() - startTime,
        message: 'Không có sản phẩm đang hoạt động để chạy dự báo.',
      };
    }

    const today = new Date();

    for (const horizon of targetHorizons) {
      for (const p of products) {
        const skuStr = p.sku.value;
        const salesAggregates = await this.salesHistoryRepository.getDailyAggregates(skuStr, 90);
        const salesHistoryFormatted = salesAggregates.map((s) => ({
          date: s.date instanceof Date ? s.date.toISOString().split('T')[0] : String(s.date),
          quantity: s.quantity,
        }));

        const coldStart = await this.coldStartRepository.findBySku(skuStr);

        let forecastResult;
        try {
          const aiResponse = await this.aiForecastClient.getForecast({
            sku: skuStr,
            horizonDays: horizon,
            salesHistory: salesHistoryFormatted,
            expectedDailySales: coldStart?.expectedDailySales || null,
          });

          const domainAiResponse: any = aiResponse
            ? {
                ...aiResponse,
                points: aiResponse.points.map((p) => ({
                  date: p.date,
                  predicted: p.predicted ?? p.forecast ?? 0,
                  lowerBound: p.lowerBound ?? 0,
                  upperBound: p.upperBound ?? 0,
                })),
              }
            : null;

          forecastResult = DemandForecastingService.evaluateAndFallback(
            domainAiResponse,
            skuStr,
            horizon,
            salesHistoryFormatted
          );
        } catch {
          forecastResult = DemandForecastingService.calculateSMA7Fallback(
            skuStr,
            horizon,
            salesHistoryFormatted
          );
        }

        await this.demandForecastRepository.saveForecast({
          productSku: skuStr,
          forecastDate: today,
          horizonDays: horizon,
          forecastedDemand: forecastResult.forecastedDemand,
          dailyAvgDemand: forecastResult.dailyAvgDemand,
          wape: forecastResult.wape,
          mae: forecastResult.mae,
          algorithmUsed: forecastResult.algorithmUsed,
          isFallback: forecastResult.isFallback,
          forecastPoints: forecastResult.points,
        });
      }
    }

    const executionTimeMs = Date.now() - startTime;
    return {
      skusAnalyzed: products.length,
      horizonsGenerated: targetHorizons,
      executionTimeMs,
      message: `Đã hoàn tất tính toán dự báo nhu cầu cho ${products.length} SKU qua chu kỳ ${targetHorizons.join(', ')} ngày.`,
    };
  }
}
