import { ForecastResultDomain, DailySalesRecord, ForecastPointDomain } from '../types/ForecastTypes';

export class DemandForecastingService {
  /**
   * BR-007: Cơ chế Fallback SMA-7
   * Tính trung bình trượt 7 ngày gần nhất khi AI sập hoặc dự báo kém.
   */
  public static calculateSMA7Fallback(
    sku: string,
    horizonDays: number,
    salesHistory: DailySalesRecord[]
  ): ForecastResultDomain {
    // 1. Lấy dữ liệu 7 ngày gần nhất (giả định đã được sắp xếp tăng dần theo date)
    const last7Days = salesHistory.slice(-7);
    
    let sma = 0;
    if (last7Days.length > 0) {
      const sum = last7Days.reduce((acc, curr) => acc + curr.quantity, 0);
      sma = sum / last7Days.length;
    }

    // 2. Tạo kết quả dự báo
    const points: ForecastPointDomain[] = [];
    let forecastedDemand = 0;

    for (let i = 1; i <= horizonDays; i++) {
      const predicted = Math.max(0, sma);
      forecastedDemand += predicted;
      
      points.push({
        date: `T+${i}`, // Ngày tương đối
        predicted: Math.round(predicted),
        lowerBound: Math.floor(predicted * 0.8),
        upperBound: Math.ceil(predicted * 1.2),
      });
    }

    // BR-008: D_avg = Tổng / T
    const dailyAvgDemand = horizonDays > 0 ? forecastedDemand / horizonDays : 0;

    return {
      sku,
      horizonDays,
      forecastedDemand: Math.ceil(forecastedDemand),
      dailyAvgDemand,
      wape: null,
      mae: null,
      algorithmUsed: 'FALLBACK_SMA7',
      isFallback: true,
      points
    };
  }

  /**
   * BR-007: Đánh giá mô hình AI. Nếu WAPE > 40% hoặc AI lỗi (null), tự động kích hoạt Fallback.
   */
  public static evaluateAndFallback(
    aiResponse: ForecastResultDomain | null,
    sku: string,
    horizonDays: number,
    salesHistory: DailySalesRecord[]
  ): ForecastResultDomain {
    if (!aiResponse || !aiResponse.algorithmUsed) {
      // Lỗi kết nối, Timeout hoặc response thiếu algorithmUsed
      return this.calculateSMA7Fallback(sku, horizonDays, salesHistory);
    }

    if (aiResponse.wape !== null && aiResponse.wape > 40) {
      // Mô hình có sai số quá cao
      return this.calculateSMA7Fallback(sku, horizonDays, salesHistory);
    }

    // Trả về AI Response bình thường
    return {
      ...aiResponse,
      dailyAvgDemand: Math.max(0, aiResponse.dailyAvgDemand),
      forecastedDemand: Math.max(0, aiResponse.forecastedDemand),
    };
  }
}
