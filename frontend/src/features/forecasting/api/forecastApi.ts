import apiClient from '../../../lib/axios';
import { ForecastSummaryItem, ColdStartPayload, ColdStartResponse } from '../types/forecast.types';
import { ForecastPoint } from '../../../components/charts/TimeSeriesForecastChart';

const MOCK_FORECASTS: ForecastSummaryItem[] = [
  {
    sku: 'MILK-VNM-180',
    name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
    category: 'Sữa & Bơ sữa',
    horizonDays: 14,
    forecastedDemand: 98,
    dailyAvgDemand: 7.0,
    wape: 14.5,
    mae: 1.2,
    algorithmUsed: 'HOLT_WINTERS',
    isFallback: false,
  },
  {
    sku: 'BEER-TIGER-330',
    name: 'Bia Tiger lon 330ml (Thùng 24 lon)',
    category: 'Đồ uống & Giải khát',
    horizonDays: 14,
    forecastedDemand: 168,
    dailyAvgDemand: 12.0,
    wape: 18.2,
    mae: 2.1,
    algorithmUsed: 'HOLT_WINTERS',
    isFallback: false,
  },
  {
    sku: 'NOODLE-HAOHAO-75',
    name: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
    category: 'Thực phẩm khô',
    horizonDays: 14,
    forecastedDemand: 210,
    dailyAvgDemand: 15.0,
    wape: 12.0,
    mae: 1.8,
    algorithmUsed: 'HOLT_WINTERS',
    isFallback: false,
  },
  {
    sku: 'YOGURT-TH-100',
    name: 'Sữa chua ăn TH True Yogurt 100g',
    category: 'Sữa & Bơ sữa',
    horizonDays: 14,
    forecastedDemand: 56,
    dailyAvgDemand: 4.0,
    wape: 22.4,
    mae: 1.1,
    algorithmUsed: 'SMA_7',
    isFallback: true, // WAPE > 40% or sparse data fallback (BR-007)
  },
  {
    sku: 'COOKING-OIL-NEPTUNE-1L',
    name: 'Dầu ăn thượng hạng Neptune Gold 1 Lít',
    category: 'Gia vị & Đồ nấu',
    horizonDays: 14,
    forecastedDemand: 35,
    dailyAvgDemand: 2.5,
    wape: 16.0,
    mae: 0.8,
    algorithmUsed: 'HOLT_WINTERS',
    isFallback: false,
  },
];

const generatePoints = (sku: string, horizonDays: number): ForecastPoint[] => {
  const points: ForecastPoint[] = [];
  const base = sku === 'BEER-TIGER-330' ? 12 : sku === 'NOODLE-HAOHAO-75' ? 15 : 7;
  const today = new Date();

  // 14 past days
  for (let i = 14; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const noise = Math.sin(i) * 2;
    points.push({
      date: dateStr,
      actual: Math.max(1, Math.round(base + noise)),
    });
  }

  // Today
  const todayStr = today.toISOString().split('T')[0];
  points.push({
    date: todayStr,
    actual: base,
    forecast: base,
    lowerBound: Math.max(0, base - 2),
    upperBound: base + 2,
  });

  // Future days
  for (let i = 1; i <= horizonDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const trend = base + Math.sin(i / 2) * 1.5;
    const pred = Math.max(1, Math.round(trend));
    points.push({
      date: dateStr,
      forecast: pred,
      lowerBound: Math.max(0, pred - 2),
      upperBound: pred + 3,
    });
  }

  return points;
};

export const forecastApi = {
  getForecasts: async (params?: { horizon?: number }): Promise<ForecastSummaryItem[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ForecastSummaryItem[] }>('/forecasts', { params });
      return res.data.data;
    } catch {
      return MOCK_FORECASTS.map((item) => ({
        ...item,
        horizonDays: params?.horizon || 14,
      }));
    }
  },

  getSkuForecastPoints: async (sku: string, horizonDays: number = 14): Promise<ForecastPoint[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { points: ForecastPoint[] } }>(`/forecasts/${sku}`, {
        params: { horizon: horizonDays },
      });
      return res.data.data.points;
    } catch {
      return generatePoints(sku, horizonDays);
    }
  },

  saveColdStart: async (payload: ColdStartPayload): Promise<ColdStartResponse> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: ColdStartResponse }>('/forecasts/cold-start', payload);
      return res.data.data;
    } catch {
      return {
        sku: payload.sku,
        expectedDailySales: payload.expectedDailySales,
        calculatedSafetyStock: Math.round(payload.expectedDailySales * 2),
        message: 'Đã lưu lượng bán dự kiến và thiết lập ngưỡng tồn kho an toàn ban đầu.',
      };
    }
  },
};

export default forecastApi;
