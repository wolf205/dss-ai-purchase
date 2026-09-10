import { getPrismaClient } from '../database/prisma';
import { SalesHistory } from '../../domain/entities/SalesHistory';
import {
  ISalesHistoryRepository,
  Product30DaysSalesStat,
} from '../../domain/repositories/ISalesHistoryRepository';

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

    const prisma = getPrismaClient();
    const records = await prisma.salesHistory.findMany({
      where,
      orderBy: { saleDate: 'asc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  public async saveBatch(records: SalesHistory[], overwriteDuplicateDates: boolean = true): Promise<number> {
    if (records.length === 0) return 0;

    const data = records.map((r) => ({
      productSku: r.productSku,
      saleDate: r.saleDate,
      quantitySold: r.quantitySold,
      revenue: r.revenue,
      source: r.source,
      importBatchId: r.importBatchId ?? undefined,
    }));

    const prisma = getPrismaClient();

    if (overwriteDuplicateDates) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map((item) =>
            prisma.salesHistory.upsert({
              where: {
                productSku_saleDate: {
                  productSku: item.productSku,
                  saleDate: item.saleDate,
                },
              },
              create: item,
              update: {
                quantitySold: item.quantitySold,
                revenue: item.revenue,
                source: item.source,
                importBatchId: item.importBatchId,
              },
            })
          )
        );
      }
      return data.length;
    }

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
    const prisma = getPrismaClient();
    const records = await prisma.salesHistory.findMany({
      where: {
        productSku: productSku.trim().toUpperCase(),
      },
      orderBy: { saleDate: 'desc' },
      take: daysCount,
    });

    records.reverse();

    return records.map((r) => ({
      date: r.saleDate,
      quantity: r.quantitySold,
    }));
  }

  public async getAll30DaysSalesStats(): Promise<Product30DaysSalesStat[]> {
    const prisma = getPrismaClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { sku: true },
    });

    const sales = await prisma.salesHistory.findMany({
      where: {
        saleDate: { gte: startDate },
        product: { isActive: true },
      },
      select: {
        productSku: true,
        saleDate: true,
        quantitySold: true,
        revenue: true,
      },
      orderBy: { saleDate: 'asc' },
    });

    const salesBySku = new Map<string, Array<{ quantity: number; revenue: number }>>();
    for (const s of sales) {
      const list = salesBySku.get(s.productSku) || [];
      list.push({ quantity: s.quantitySold, revenue: Number(s.revenue) });
      salesBySku.set(s.productSku, list);
    }

    const results: Product30DaysSalesStat[] = [];

    for (const prod of activeProducts) {
      const records = salesBySku.get(prod.sku) || [];
      const historyDaysCount = records.length;
      const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
      const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);

      // Mean daily quantity over 30 days window
      const meanDailyQuantity = historyDaysCount > 0 ? totalQuantity / 30 : 0;

      // Sample std deviation
      let stdDevDailyQuantity = 0;
      if (historyDaysCount > 1) {
        const meanSample = totalQuantity / historyDaysCount;
        const variance =
          records.reduce((sum, r) => sum + Math.pow(r.quantity - meanSample, 2), 0) / (historyDaysCount - 1);
        stdDevDailyQuantity = Math.sqrt(variance);
      }

      results.push({
        productSku: prod.sku,
        totalRevenue,
        meanDailyQuantity,
        stdDevDailyQuantity,
        historyDaysCount,
      });
    }

    return results;
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
