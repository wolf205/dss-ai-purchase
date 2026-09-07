import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ForecastSummaryItemDTO } from '../../dtos/ForecastDTO';

export class GetForecastsUseCase {
  constructor(
    private readonly demandForecastRepository: IDemandForecastRepository,
    private readonly productRepository: IProductRepository
  ) {}

  public async execute(horizonDays: number = 14): Promise<ForecastSummaryItemDTO[]> {
    const [forecasts, { products }] = await Promise.all([
      this.demandForecastRepository.findAllLatest(horizonDays),
      this.productRepository.findAll({ isActive: true, limit: 1000 }),
    ]);

    const productMap = new Map<string, { name: string; category: string }>();
    for (const p of products) {
      productMap.set(p.sku.value, { name: p.name, category: p.category });
    }

    return forecasts.map((fc) => {
      const prod = productMap.get(fc.productSku);
      return {
        sku: fc.productSku,
        name: prod?.name || fc.productSku,
        category: prod?.category || '',
        horizonDays: fc.horizonDays,
        forecastedDemand: fc.forecastedDemand,
        dailyAvgDemand: fc.dailyAvgDemand,
        wape: fc.wape,
        mae: fc.mae,
        algorithmUsed: fc.algorithmUsed,
        isFallback: fc.isFallback,
      };
    });
  }
}
