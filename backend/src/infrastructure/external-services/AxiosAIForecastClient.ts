import axios, { AxiosInstance } from 'axios';
import { IAIForecastClient } from '../../application/ports/IAIForecastClient';
import { ForecastRequestPayload, ForecastResponsePayload } from '../../application/dtos/ForecastDTO';

export class AxiosAIForecastClient implements IAIForecastClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 4000, // NFR-04: Timeout tối đa 4 giây
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public async getForecast(payload: ForecastRequestPayload): Promise<ForecastResponsePayload> {
    try {
      // Map properties to snake_case for Python FastAPI
      const requestData = {
        sku: payload.sku,
        horizon_days: payload.horizonDays,
        sales_history: payload.salesHistory.map(item => ({
          date: item.date,
          quantity: item.quantity
        })),
        expected_daily_sales: payload.expectedDailySales ?? null,
      };

      const response = await this.client.post('/api/v1/forecast', requestData);
      
      const data = response.data;
      
      // Map back to camelCase DTO (hỗ trợ cả camelCase và snake_case từ AI Service)
      return {
        sku: data.sku,
        horizonDays: data.horizonDays ?? data.horizon_days ?? payload.horizonDays,
        forecastedDemand: data.forecastedDemand ?? data.forecasted_demand ?? 0,
        dailyAvgDemand: data.dailyAvgDemand ?? data.daily_avg_demand ?? 0,
        wape: data.wape ?? null,
        mae: data.mae ?? null,
        algorithmUsed: data.algorithmUsed ?? data.algorithm_used,
        isFallback: data.isFallback ?? data.is_fallback ?? false,
        points: (data.points || []).map((p: any) => ({
          date: p.date,
          predicted: p.predicted ?? 0,
          lowerBound: p.lowerBound ?? p.lower_bound ?? 0,
          upperBound: p.upperBound ?? p.upper_bound ?? (p.predicted ?? 0),
        })),
      };
    } catch (error) {
      // Nếu có lỗi Timeout, Network hoặc 5xx, rethrow lại để Service bắt và xử lý Fallback
      throw new Error(`AIForecastClient Error: ${error instanceof Error ? error.message : 'Unknown Error'}`);
    }
  }
}
