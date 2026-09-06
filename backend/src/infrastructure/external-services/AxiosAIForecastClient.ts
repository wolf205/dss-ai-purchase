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
      
      // Map back to camelCase DTO
      return {
        sku: data.sku,
        horizonDays: data.horizon_days,
        forecastedDemand: data.forecasted_demand,
        dailyAvgDemand: data.daily_avg_demand,
        wape: data.wape,
        mae: data.mae,
        algorithmUsed: data.algorithm_used,
        isFallback: data.is_fallback,
        points: data.points.map((p: any) => ({
          date: p.date,
          predicted: p.predicted,
          lowerBound: p.lower_bound,
          upperBound: p.upper_bound,
        }))
      };
    } catch (error) {
      // Nếu có lỗi Timeout, Network hoặc 5xx, rethrow lại để Service bắt và xử lý Fallback
      throw new Error(`AIForecastClient Error: ${error instanceof Error ? error.message : 'Unknown Error'}`);
    }
  }
}
