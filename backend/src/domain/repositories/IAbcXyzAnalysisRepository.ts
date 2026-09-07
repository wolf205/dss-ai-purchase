export interface AbcXyzRecord {
  productSku: string;
  analysisDate: Date;
  windowDays: number;
  totalRevenue: number;
  revenuePct: number;
  cumulativeRevenuePct: number;
  abcClass: 'A' | 'B' | 'C';
  dailySalesMean: number;
  dailySalesStdDev: number;
  coefficientOfVariation: number;
  xyzClass: 'X' | 'Y' | 'Z';
  abcXyzSegment: string;
}

export interface IAbcXyzAnalysisRepository {
  saveBatch(records: AbcXyzRecord[]): Promise<void>;
  getLatestMatrix(): Promise<Record<string, { skuCount: number; revenuePct: number }>>;
  findLatestBySku(productSku: string): Promise<AbcXyzRecord | null>;
  getAllLatest(): Promise<AbcXyzRecord[]>;
}
