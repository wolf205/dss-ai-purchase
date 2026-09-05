import { SalesHistory } from '../entities/SalesHistory';

export interface ISalesHistoryRepository {
  findByProductSku(productSku: string, options?: { startDate?: Date; endDate?: Date }): Promise<SalesHistory[]>;
  saveBatch(records: SalesHistory[]): Promise<number>;
  getDailyAggregates(productSku: string, daysCount: number): Promise<{ date: Date; quantity: number }[]>;
}
