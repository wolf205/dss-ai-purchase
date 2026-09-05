import { prisma } from '../database/prisma';
import { SalesHistory } from '../../domain/entities/SalesHistory';
import { ISalesHistoryRepository } from '../../domain/repositories/ISalesHistoryRepository';

export class PrismaSalesHistoryRepository implements ISalesHistoryRepository {
  public async findByProductSku(
    productSku: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<SalesHistory[]> {
    const where: any = {
      productSku: productSku.trim().toUpperCase(),
    };
    if (options?.startDate || options?.endDate) {
      where.saleDate = {};
      if (options.startDate) where.saleDate.gte = options.startDate;
      if (options.endDate) where.saleDate.lte = options.endDate;
    }

    const records = await prisma.salesHistory.findMany({
      where,
      orderBy: { saleDate: 'asc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  public async saveBatch(records: SalesHistory[]): Promise<number> {
    if (records.length === 0) return 0;

    const data = records.map((r) => ({
      productSku: r.productSku,
      saleDate: r.saleDate,
      quantitySold: r.quantitySold,
      revenue: r.revenue,
      source: r.source,
      importBatchId: r.importBatchId ?? undefined,
    }));

    const result = await prisma.salesHistory.createMany({
      data,
      skipDuplicates: true,
    });

    return result.count;
  }

  public async getDailyAggregates(
    productSku: string,
    daysCount: number
  ): Promise<{ date: Date; quantity: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.salesHistory.findMany({
      where: {
        productSku: productSku.trim().toUpperCase(),
        saleDate: { gte: startDate },
      },
      orderBy: { saleDate: 'asc' },
    });

    return records.map((r) => ({
      date: r.saleDate,
      quantity: r.quantitySold,
    }));
  }

  private toDomain(record: any): SalesHistory {
    return new SalesHistory({
      id: record.id.toString(),
      productSku: record.productSku,
      saleDate: record.saleDate,
      quantitySold: record.quantitySold,
      revenue: Number(record.revenue),
      source: record.source,
      importBatchId: record.importBatchId,
      createdAt: record.createdAt,
    });
  }
}
