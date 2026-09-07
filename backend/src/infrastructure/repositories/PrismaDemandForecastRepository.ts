import { getPrismaClient } from '../database/prisma';
import {
  IDemandForecastRepository,
  DemandForecastRecord,
} from '../../domain/repositories/IDemandForecastRepository';

export class PrismaDemandForecastRepository implements IDemandForecastRepository {
  public async saveForecast(record: DemandForecastRecord): Promise<void> {
    const prisma = getPrismaClient();
    const forecastDate = new Date(record.forecastDate);
    forecastDate.setHours(0, 0, 0, 0);

    await prisma.demandForecast.upsert({
      where: {
        productSku_forecastDate_horizonDays: {
          productSku: record.productSku,
          forecastDate,
          horizonDays: record.horizonDays,
        },
      },
      create: {
        productSku: record.productSku,
        forecastDate,
        horizonDays: record.horizonDays,
        forecastedDemand: record.forecastedDemand,
        dailyAvgDemand: record.dailyAvgDemand,
        wape: record.wape !== null ? record.wape : null,
        mae: record.mae !== null ? record.mae : null,
        algorithmUsed: record.algorithmUsed as any,
        isFallback: record.isFallback,
        forecastPoints: record.forecastPoints,
      },
      update: {
        forecastedDemand: record.forecastedDemand,
        dailyAvgDemand: record.dailyAvgDemand,
        wape: record.wape !== null ? record.wape : null,
        mae: record.mae !== null ? record.mae : null,
        algorithmUsed: record.algorithmUsed as any,
        isFallback: record.isFallback,
        forecastPoints: record.forecastPoints,
      },
    });
  }

  public async saveBatch(records: DemandForecastRecord[]): Promise<void> {
    for (const record of records) {
      await this.saveForecast(record);
    }
  }

  public async findLatestBySku(
    productSku: string,
    horizonDays: number = 14
  ): Promise<DemandForecastRecord | null> {
    const prisma = getPrismaClient();
    const record = await prisma.demandForecast.findFirst({
      where: {
        productSku: productSku.trim().toUpperCase(),
        horizonDays,
      },
      orderBy: { forecastDate: 'desc' },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAllLatest(horizonDays: number = 14): Promise<DemandForecastRecord[]> {
    const prisma = getPrismaClient();
    // Get all active products first
    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { sku: true },
    });

    const results: DemandForecastRecord[] = [];

    for (const p of activeProducts) {
      const latest = await prisma.demandForecast.findFirst({
        where: {
          productSku: p.sku,
          horizonDays,
        },
        orderBy: { forecastDate: 'desc' },
      });
      if (latest) {
        results.push(this.toDomain(latest));
      }
    }

    return results;
  }

  private toDomain(record: any): DemandForecastRecord {
    return {
      id: record.id,
      productSku: record.productSku,
      forecastDate: record.forecastDate,
      horizonDays: record.horizonDays,
      forecastedDemand: record.forecastedDemand,
      dailyAvgDemand: Number(record.dailyAvgDemand),
      wape: record.wape !== null ? Number(record.wape) : null,
      mae: record.mae !== null ? Number(record.mae) : null,
      algorithmUsed: record.algorithmUsed,
      isFallback: record.isFallback,
      forecastPoints: record.forecastPoints,
      createdAt: record.createdAt,
    };
  }
}
