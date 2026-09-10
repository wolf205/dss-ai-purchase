export interface DailySalesHistoryItem {
  date: string;       // Định dạng YYYY-MM-DD
  quantity: number;   // Số lượng bán (>= 0)
}

export interface ForecastRequestPayload {
  sku: string;
  horizonDays: 7 | 14 | 30;
  salesHistory: DailySalesHistoryItem[];
  expectedDailySales?: number | null; // Dùng cho sản phẩm Cold Start (< 14 ngày)
}

export interface ForecastPointDTO {
  date: string;         // YYYY-MM-DD
  actual?: number;      // Lượng bán thực tế trong quá khứ (nếu có)
  forecast?: number;    // Lượng bán dự báo tương lai
  predicted?: number;   // Lượng bán dự báo tương lai (giữ tương thích)
  lowerBound?: number;  // Cận dưới dải tin cậy: max(0, ceil(predicted - 1.65 * MAE))
  upperBound?: number;  // Cận trên dải tin cậy: ceil(predicted + 1.65 * MAE)
}

export interface ForecastResponsePayload {
  sku: string;
  horizonDays: number;
  forecastedDemand: number; // Tổng cầu dự báo chu kỳ: ceil(sum(max(0, predicted)))
  dailyAvgDemand: number;   // Nhu cầu trung bình ngày D_avg
  wape: number | null;      // Sai số WAPE (%)
  mae: number | null;       // Sai số tuyệt đối MAE
  algorithmUsed: 'AI_MODEL' | 'FALLBACK_SMA7' | 'BASIC_SMA7' | 'COLD_START_ESTIMATE';
  isFallback: boolean;
  points: ForecastPointDTO[];
}

export interface ColdStartInputDTO {
  sku: string;
  expectedDailySales: number;
  notes?: string;
  updatedBy?: string;
}

export interface ColdStartResponseDTO {
  sku: string;
  expectedDailySales: number;
  calculatedSafetyStock: number;
  message: string;
}

export interface ForecastSummaryItemDTO {
  sku: string;
  name: string;
  category: string;
  horizonDays: number;
  forecastedDemand: number;
  dailyAvgDemand: number;
  wape: number | null;
  mae: number | null;
  algorithmUsed: string;
  isFallback: boolean;
}

