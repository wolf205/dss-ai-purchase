import { ForecastRequestPayload, ForecastResponsePayload } from '../dtos/ForecastDTO';

export interface IAIForecastClient {
  /**
   * Gọi AI Service để lấy dự báo cho 1 SKU.
   * Cần có timeout = 4000ms.
   * Ném ra ngoại lệ hoặc trả về null nếu timeout/lỗi kết nối.
   */
  getForecast(payload: ForecastRequestPayload): Promise<ForecastResponsePayload>;
}
