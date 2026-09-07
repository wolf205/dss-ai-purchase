import { getPrismaClient } from '../database/prisma';
import {
  IAbcXyzAnalysisRepository,
  AbcXyzRecord,
} from '../../domain/repositories/IAbcXyzAnalysisRepository';

export class PrismaAbcXyzAnalysisRepository implements IAbcXyzAnalysisRepository {
  public async saveBatch(records: AbcXyzRecord[]): Promise<void> {
    if (records.length === 0) return;
    const prisma = getPrismaClient();

    for (const record of records) {
      const analysisDate = new Date(record.analysisDate);
      analysisDate.setHours(0, 0, 0, 0);

      await prisma.abcXyzAnalysis.upsert({
        where: {
          productSku_analysisDate: {
            productSku: record.productSku,
            analysisDate,
          },
        },
        create: {
          productSku: record.productSku,
          analysisDate,
          windowDays: record.windowDays,
          totalRevenue: record.totalRevenue,
          revenuePct: record.revenuePct,
          cumulativeRevenuePct: record.cumulativeRevenuePct,
          abcClass: record.abcClass as any,
          dailySalesMean: record.dailySalesMean,
          dailySalesStdDev: record.dailySalesStdDev,
          coefficientOfVariation: record.coefficientOfVariation,
          xyzClass: record.xyzClass as any,
          abcXyzSegment: record.abcXyzSegment as any,
        },
        update: {
          windowDays: record.windowDays,
          totalRevenue: record.totalRevenue,
          revenuePct: record.revenuePct,
          cumulativeRevenuePct: record.cumulativeRevenuePct,
          abcClass: record.abcClass as any,
          dailySalesMean: record.dailySalesMean,
          dailySalesStdDev: record.dailySalesStdDev,
          coefficientOfVariation: record.coefficientOfVariation,
          xyzClass: record.xyzClass as any,
          abcXyzSegment: record.abcXyzSegment as any,
        },
      });
    }
  }

  public async getLatestMatrix(): Promise<Record<string, { skuCount: number; revenuePct: number }>> {
    const prisma = getPrismaClient();

    // Find the latest analysisDate
    const latestRecord = await prisma.abcXyzAnalysis.findFirst({
      orderBy: { analysisDate: 'desc' },
      select: { analysisDate: true },
    });

    const matrix: Record<string, { skuCount: number; revenuePct: number }> = {
      AX: { skuCount: 0, revenuePct: 0 },
      AY: { skuCount: 0, revenuePct: 0 },
      AZ: { skuCount: 0, revenuePct: 0 },
      BX: { skuCount: 0, revenuePct: 0 },
      BY: { skuCount: 0, revenuePct: 0 },
      BZ: { skuCount: 0, revenuePct: 0 },
      CX: { skuCount: 0, revenuePct: 0 },
      CY: { skuCount: 0, revenuePct: 0 },
      CZ: { skuCount: 0, revenuePct: 0 },
    };

    if (!latestRecord) {
      return matrix;
    }

    const records = await prisma.abcXyzAnalysis.findMany({
      where: {
        analysisDate: latestRecord.analysisDate,
        product: { isActive: true },
      },
    });

    for (const r of records) {
      const seg = r.abcXyzSegment;
      if (matrix[seg]) {
        matrix[seg].skuCount += 1;
        matrix[seg].revenuePct += Number(r.revenuePct);
      }
    }

    // Round revenuePct to 1 decimal place
    for (const key of Object.keys(matrix)) {
      matrix[key].revenuePct = Math.round(matrix[key].revenuePct * 10) / 10;
    }

    return matrix;
  }

  public async findLatestBySku(productSku: string): Promise<AbcXyzRecord | null> {
    const prisma = getPrismaClient();
    const record = await prisma.abcXyzAnalysis.findFirst({
      where: { productSku: productSku.trim().toUpperCase() },
      orderBy: { analysisDate: 'desc' },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  public async getAllLatest(): Promise<AbcXyzRecord[]> {
    const prisma = getPrismaClient();
    const latestRecord = await prisma.abcXyzAnalysis.findFirst({
      orderBy: { analysisDate: 'desc' },
      select: { analysisDate: true },
    });

    if (!latestRecord) return [];

    const records = await prisma.abcXyzAnalysis.findMany({
      where: {
        analysisDate: latestRecord.analysisDate,
        product: { isActive: true },
      },
      orderBy: { totalRevenue: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  private toDomain(record: any): AbcXyzRecord {
    return {
      productSku: record.productSku,
      analysisDate: record.analysisDate,
      windowDays: record.windowDays,
      totalRevenue: Number(record.totalRevenue),
      revenuePct: Number(record.revenuePct),
      cumulativeRevenuePct: Number(record.cumulativeRevenuePct),
      abcClass: record.abcClass,
      dailySalesMean: Number(record.dailySalesMean),
      dailySalesStdDev: Number(record.dailySalesStdDev),
      coefficientOfVariation: Number(record.coefficientOfVariation),
      xyzClass: record.xyzClass,
      abcXyzSegment: record.abcXyzSegment,
    };
  }
}
