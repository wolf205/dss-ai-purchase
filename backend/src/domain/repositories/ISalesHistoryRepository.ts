import { SalesHistory } from '../entities/SalesHistory';

export interface Product30DaysSalesStat {
  productSku: string;
  totalRevenue: number;
  meanDailyQuantity: number;
  stdDevDailyQuantity: number;
  historyDaysCount: number;
}

export interface ISalesHistoryRepository {
  findByProductSku(productSku: string, options?: { startDate?: Date; endDate?: Date }): Promise<SalesHistory[]>;
  saveBatch(records: SalesHistory[], overwriteDuplicateDates?: boolean): Promise<number>;
  getDailyAggregates(productSku: string, daysCount: number): Promise<{ date: Date; quantity: number }[]>;
  getAll30DaysSalesStats(): Promise<Product30DaysSalesStat[]>;
}
