export interface DemandForecastRecord {
  id?: bigint;
  productSku: string;
  forecastDate: Date;
  horizonDays: number;
  forecastedDemand: number;
  dailyAvgDemand: number;
  wape: number | null;
  mae: number | null;
  algorithmUsed: string;
  isFallback: boolean;
  forecastPoints: any;
  createdAt?: Date;
}

export interface IDemandForecastRepository {
  saveForecast(record: DemandForecastRecord): Promise<void>;
  saveBatch(records: DemandForecastRecord[]): Promise<void>;
  findLatestBySku(productSku: string, horizonDays?: number): Promise<DemandForecastRecord | null>;
  findAllLatest(horizonDays?: number): Promise<DemandForecastRecord[]>;
}
