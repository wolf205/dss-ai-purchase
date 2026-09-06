import { RiskLevelEnum } from '../value-objects/RiskLevel';

/**
 * Domain Service: InventoryCalculator
 * Chịu trách nhiệm thực thi các công thức toán học liên quan đến định lượng tồn kho.
 * Các phương thức là Pure Functions, hoàn toàn không có trạng thái.
 */
export class InventoryCalculator {
  // Hệ số Z cho Service Level 95%
  private static readonly Z_SCORE_95 = 1.65;

  /**
   * BR-001: Vị trí Tồn kho Định vị (Inventory Position)
   * @param onHand Số lượng tồn kho thực tế khả dụng
   * @param onOrder Tổng số lượng chờ nhận (trong các PO ORDERED)
   * @returns Vị trí tồn kho IP
   */
  public static calculateInventoryPosition(onHand: number, onOrder: number): number {
    return onHand + onOrder;
  }

  /**
   * BR-003: Tính toán Safety Stock (SS) bằng phương pháp thống kê
   * @param stdDev Độ lệch chuẩn lượng bán hàng ngày
   * @param leadTime Thời gian giao hàng (ngày)
   * @param minSafetyStock Tồn kho an toàn tối thiểu (mặc định = 0)
   * @returns Safety Stock đã làm tròn lên
   */
  public static calculateSafetyStock(stdDev: number, leadTime: number, minSafetyStock: number = 0): number {
    const ss = Math.ceil(this.Z_SCORE_95 * stdDev * Math.sqrt(leadTime));
    return Math.max(ss, minSafetyStock);
  }

  /**
   * BR-003 Fallback: Tính SS cho hàng mới (Cold Start - dưới 14 ngày)
   * @param dExpected Nhu cầu bán dự kiến ngày
   * @returns Safety Stock đã làm tròn lên
   */
  public static calculateSafetyStockColdStart(dExpected: number): number {
    return Math.ceil(dExpected * 2);
  }

  /**
   * BR-004: Điểm đặt hàng lại (Reorder Point - ROP)
   * @param dAvg Nhu cầu bán trung bình ngày
   * @param leadTime Thời gian giao hàng (ngày)
   * @param safetyStock Tồn kho an toàn (SS)
   * @returns ROP đã làm tròn lên
   */
  public static calculateReorderPoint(dAvg: number, leadTime: number, safetyStock: number): number {
    return Math.ceil(dAvg * leadTime + safetyStock);
  }

  /**
   * BR-004: Tồn kho tối đa (Max Stock)
   * @param rop Điểm đặt hàng lại
   * @param dAvg Nhu cầu bán trung bình ngày
   * @returns Tồn kho tối đa đã làm tròn lên
   */
  public static calculateMaxStock(rop: number, dAvg: number): number {
    return rop + Math.ceil(dAvg * 30);
  }

  /**
   * BR-005: Số ngày bán còn lại (Days of Supply - DoS)
   * @param onHand Tồn kho khả dụng
   * @param dAvg Nhu cầu trung bình ngày
   * @returns Số ngày bán còn lại (999 nếu là hàng bất động)
   */
  public static calculateDaysOfSupply(onHand: number, dAvg: number): number {
    if (onHand <= 0) return 0;
    if (dAvg <= 0) return 999;
    return onHand / dAvg;
  }

  /**
   * BR-023: Đánh giá Hàng tồn bất động (Dead Stock)
   * @param onHand Tồn kho khả dụng
   * @param dAvg Nhu cầu trung bình ngày
   * @returns true nếu là hàng bất động
   */
  public static isDeadStock(onHand: number, dAvg: number): boolean {
    return onHand > 0 && dAvg === 0;
  }

  /**
   * BR-002: Đánh giá cấp độ rủi ro tồn kho
   * @param inventoryPosition Vị trí tồn kho (IP)
   * @param safetyStock Tồn kho an toàn (SS)
   * @param rop Điểm đặt hàng lại (ROP)
   * @param maxStock Tồn kho tối đa
   * @param onHand Tồn kho khả dụng thực tế
   * @returns Enum cấp độ rủi ro
   */
  public static evaluateRiskLevel(
    inventoryPosition: number,
    safetyStock: number,
    rop: number,
    maxStock: number,
    onHand: number
  ): RiskLevelEnum {
    if (onHand <= 0) {
      return RiskLevelEnum.OUT_OF_STOCK;
    }
    if (inventoryPosition < safetyStock) {
      return RiskLevelEnum.CRITICAL;
    }
    if (inventoryPosition >= safetyStock && inventoryPosition <= rop) {
      return RiskLevelEnum.WARNING;
    }
    if (inventoryPosition > maxStock) {
      return RiskLevelEnum.OVERSTOCK;
    }
    return RiskLevelEnum.NORMAL;
  }
}
