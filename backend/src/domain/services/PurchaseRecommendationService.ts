import { OrderRoundingService } from './OrderRoundingService';
import { SupplierScoreResult } from './SupplierScoringService';

export interface SupplierOption {
  id: string;
  name: string;
  scoreResult: SupplierScoreResult;
  averageLeadTimeDays: number;
  supplierPrice: number;
}

export interface PurchaseRecommendationResult {
  rawShortage: number;      // Q_raw
  suggestedQuantity: number; // Q_suggested
  suggestedOrderDate: string | null; // "YYYY-MM-DD" hoặc "N/A"
  daysUntilReorder: number | null; 
  selectedSupplier: SupplierOption | null;
  insight: string;
}

export class PurchaseRecommendationService {
  /**
   * Tính toán lượng mua đề xuất và ngày đặt hàng (BR-014, BR-015)
   */
  public static generateRecommendation(
    forecastedDemand: number,
    safetyStock: number,
    inventoryPosition: number, // On-Hand + On-Order
    rop: number,
    dailyAvgDemand: number,
    moq: number = 1,
    packSize: number = 1,
    suppliers: SupplierOption[] = [],
    todayDateString: string // YYYY-MM-DD
  ): PurchaseRecommendationResult {
    // 1. Tính lượng thiếu hụt thô (BR-014)
    const rawShortage = forecastedDemand + safetyStock - inventoryPosition;

    // 2. Tính lượng mua đề xuất qua OrderRoundingService
    const suggestedQuantity = OrderRoundingService.calculateSuggestedQuantity(rawShortage, moq, packSize);

    // 3. Tính ngày hẹn đặt hàng (BR-015)
    let daysUntilReorder: number | null = null;
    let suggestedOrderDate: string | null = null;

    if (inventoryPosition <= rop) {
      daysUntilReorder = 0;
      suggestedOrderDate = todayDateString;
    } else {
      if (dailyAvgDemand > 0) {
        daysUntilReorder = Math.max(0, Math.floor((inventoryPosition - rop) / dailyAvgDemand));
        const dateObj = new Date(todayDateString);
        dateObj.setDate(dateObj.getDate() + daysUntilReorder);
        suggestedOrderDate = dateObj.toISOString().split('T')[0];
      } else {
        // Dead stock hoặc dailyAvgDemand = 0
        daysUntilReorder = null;
        suggestedOrderDate = 'N/A';
      }
    }

    // 4. Chọn nhà cung cấp tối ưu (BR-016)
    const selectedSupplier = this.selectOptimalSupplier(suppliers);

    // 5. Sinh Insight tiếng Việt
    const insight = this.generateInsight(suggestedQuantity, selectedSupplier, daysUntilReorder, packSize);

    return {
      rawShortage,
      suggestedQuantity,
      suggestedOrderDate,
      daysUntilReorder,
      selectedSupplier,
      insight
    };
  }

  /**
   * BR-016: Tie-breaker algorithm
   * 1. Điểm tổng cao nhất
   * 2. Lead time ngắn nhất
   * 3. Giá rẻ nhất
   */
  public static selectOptimalSupplier(suppliers: SupplierOption[]): SupplierOption | null {
    if (!suppliers || suppliers.length === 0) return null;

    return [...suppliers].sort((a, b) => {
      // Rule 1: Tổng điểm giảm dần
      if (b.scoreResult.totalScore !== a.scoreResult.totalScore) {
        return b.scoreResult.totalScore - a.scoreResult.totalScore;
      }
      // Rule 2: Lead time tăng dần (ngắn nhất)
      if (a.averageLeadTimeDays !== b.averageLeadTimeDays) {
        return a.averageLeadTimeDays - b.averageLeadTimeDays;
      }
      // Rule 3: Giá tăng dần (rẻ nhất)
      return a.supplierPrice - b.supplierPrice;
    })[0];
  }

  private static generateInsight(
    qty: number,
    supplier: SupplierOption | null,
    days: number | null,
    packSize: number
  ): string {
    if (qty <= 0) {
      return `Tồn kho hiện tại vẫn đáp ứng đủ, không cần đặt thêm hàng.`;
    }

    const supplierText = supplier ? `từ NCC ${supplier.name}` : `(Chưa có NCC phù hợp)`;
    const packs = qty / packSize;
    const packText = packSize > 1 ? ` (${packs} lốc/thùng)` : ``;

    if (days === 0) {
      return `Đề xuất đặt mua GẤP ${qty} sản phẩm${packText} ${supplierText} vì tồn kho đã chạm ngưỡng ROP.`;
    }
    
    if (days === null) {
      return `Đề xuất mua ${qty} sản phẩm${packText} ${supplierText}. Tuy nhiên hàng đang bán rất chậm, cần cân nhắc.`;
    }

    return `Đề xuất mua ${qty} sản phẩm${packText} ${supplierText} do tồn kho dự kiến sẽ chạm ROP sau ${days} ngày nữa.`;
  }
}
