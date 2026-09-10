import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ISalesHistoryRepository } from '../../../domain/repositories/ISalesHistoryRepository';
import { EntityNotFoundException } from '../../exceptions';
import { ForecastResponsePayload, ForecastPointDTO } from '../../dtos/ForecastDTO';

export class GetSkuForecastUseCase {
  constructor(
    private readonly demandForecastRepository: IDemandForecastRepository,
    private readonly productRepository: IProductRepository,
    private readonly salesHistoryRepository: ISalesHistoryRepository
  ) {}

  public async execute(sku: string, horizonDays: number = 14): Promise<ForecastResponsePayload> {
    const cleanSku = sku.trim().toUpperCase();

    const product = await this.productRepository.findBySku(cleanSku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', cleanSku);
    }

    const [forecast, salesHistory] = await Promise.all([
      this.demandForecastRepository.findLatestBySku(cleanSku, horizonDays),
      this.salesHistoryRepository.getDailyAggregates(cleanSku, 14),
    ]);

    const points: ForecastPointDTO[] = [];

    // 1. Thêm 14 ngày bán thực tế trong quá khứ
    if (salesHistory && salesHistory.length > 0) {
      for (const item of salesHistory) {
        points.push({
          date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
          actual: item.quantity,
        });
      }
    }

    // 2. Thêm các ngày dự báo trong tương lai
    if (forecast && forecast.forecastPoints && Array.isArray(forecast.forecastPoints)) {
      for (const fp of forecast.forecastPoints) {
        const pred = fp.predicted ?? fp.forecast ?? 0;
        points.push({
          date: fp.date,
          forecast: pred,
          predicted: pred,
          lowerBound: fp.lowerBound,
          upperBound: fp.upperBound,
        });
      }
    }

    if (!forecast) {
      return {
        sku: cleanSku,
        horizonDays,
        forecastedDemand: 0,
        dailyAvgDemand: 0,
        wape: null,
        mae: null,
        algorithmUsed: 'BASIC_SMA7',
        isFallback: true,
        points,
      };
    }

    return {
      sku: forecast.productSku,
      horizonDays: forecast.horizonDays,
      forecastedDemand: forecast.forecastedDemand,
      dailyAvgDemand: forecast.dailyAvgDemand,
      wape: forecast.wape,
      mae: forecast.mae,
      algorithmUsed: forecast.algorithmUsed as any,
      isFallback: forecast.isFallback,
      points,
    };
  }
}

