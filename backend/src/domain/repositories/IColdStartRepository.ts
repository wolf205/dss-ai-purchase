export interface ColdStartRecord {
  productSku: string;
  historyDaysCount: number;
  expectedDailySales: number;
  notes?: string | null;
  updatedBy?: string | null;
  updatedAt?: Date;
}

export interface IColdStartRepository {
  save(record: ColdStartRecord): Promise<ColdStartRecord>;
  findBySku(productSku: string): Promise<ColdStartRecord | null>;
  findAll(): Promise<ColdStartRecord[]>;
}
