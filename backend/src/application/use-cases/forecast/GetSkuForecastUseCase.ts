import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { EntityNotFoundException } from '../../exceptions';
import { ForecastResponsePayload } from '../../dtos/ForecastDTO';

export class GetSkuForecastUseCase {
  constructor(
    private readonly demandForecastRepository: IDemandForecastRepository,
    private readonly productRepository: IProductRepository
  ) {}

  public async execute(sku: string, horizonDays: number = 14): Promise<ForecastResponsePayload> {
    const cleanSku = sku.trim().toUpperCase();

    const product = await this.productRepository.findBySku(cleanSku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', cleanSku);
    }

    const forecast = await this.demandForecastRepository.findLatestBySku(cleanSku, horizonDays);

    if (!forecast) {
      // Fallback empty points if forecast has not been generated yet
      return {
        sku: cleanSku,
        horizonDays,
        forecastedDemand: 0,
        dailyAvgDemand: 0,
        wape: null,
        mae: null,
        algorithmUsed: 'BASIC_SMA7',
        isFallback: true,
        points: [],
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
      points: Array.isArray(forecast.forecastPoints) ? forecast.forecastPoints : [],
    };
  }
}
