import { getPrismaClient } from '../database/prisma';
import {
  IColdStartRepository,
  ColdStartRecord,
} from '../../domain/repositories/IColdStartRepository';

export class PrismaColdStartRepository implements IColdStartRepository {
  public async save(record: ColdStartRecord): Promise<ColdStartRecord> {
    const prisma = getPrismaClient();

    const saved = await prisma.coldStartInput.upsert({
      where: { productSku: record.productSku.trim().toUpperCase() },
      create: {
        productSku: record.productSku.trim().toUpperCase(),
        expectedDailySales: record.expectedDailySales,
        historyDaysCount: record.historyDaysCount || 0,
        notes: record.notes ?? null,
        updatedBy: record.updatedBy ?? null,
      },
      update: {
        expectedDailySales: record.expectedDailySales,
        historyDaysCount: record.historyDaysCount || 0,
        notes: record.notes ?? null,
        updatedBy: record.updatedBy ?? null,
      },
    });

    return {
      productSku: saved.productSku,
      expectedDailySales: saved.expectedDailySales,
      historyDaysCount: saved.historyDaysCount,
      notes: saved.notes,
      updatedBy: saved.updatedBy,
      updatedAt: saved.updatedAt,
    };
  }

  public async findBySku(productSku: string): Promise<ColdStartRecord | null> {
    const prisma = getPrismaClient();
    const found = await prisma.coldStartInput.findUnique({
      where: { productSku: productSku.trim().toUpperCase() },
    });
    if (!found) return null;

    return {
      productSku: found.productSku,
      expectedDailySales: found.expectedDailySales,
      historyDaysCount: found.historyDaysCount,
      notes: found.notes,
      updatedBy: found.updatedBy,
      updatedAt: found.updatedAt,
    };
  }

  public async findAll(): Promise<ColdStartRecord[]> {
    const prisma = getPrismaClient();
    const records = await prisma.coldStartInput.findMany();
    return records.map((r) => ({
      productSku: r.productSku,
      expectedDailySales: r.expectedDailySales,
      historyDaysCount: r.historyDaysCount,
      notes: r.notes,
      updatedBy: r.updatedBy,
      updatedAt: r.updatedAt,
    }));
  }
}
