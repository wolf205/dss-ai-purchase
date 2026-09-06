export interface ForecastSummaryItem {
  sku: string;
  name: string;
  category: string;
  horizonDays: number;
  forecastedDemand: number;
  dailyAvgDemand: number;
  wape: number;
  mae: number;
  algorithmUsed: string;
  isFallback: boolean;
}

export interface ColdStartPayload {
  sku: string;
  expectedDailySales: number;
  notes?: string;
}

export interface ColdStartResponse {
  sku: string;
  expectedDailySales: number;
  calculatedSafetyStock: number;
  message: string;
}
