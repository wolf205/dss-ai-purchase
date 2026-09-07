export interface DailySalesRecord {
  date: string;       // Format: YYYY-MM-DD
  quantity: number;   // Sold quantity (>= 0)
}

export interface ForecastPointDomain {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResultDomain {
  sku: string;
  horizonDays: number;
  forecastedDemand: number;
  dailyAvgDemand: number;
  wape: number | null;
  mae: number | null;
  algorithmUsed: 'AI_MODEL' | 'FALLBACK_SMA7' | 'BASIC_SMA7' | 'COLD_START_ESTIMATE';
  isFallback: boolean;
  points: ForecastPointDomain[];
}
