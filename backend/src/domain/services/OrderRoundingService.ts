export class OrderRoundingService {
  /**
   * Calculates the suggested purchase quantity Q_suggested based on raw shortage, MOQ and Pack Size.
   *
   * Business Rules:
   * - BR-014: Q_raw = Forecast + SS - (On-Hand + On-Order)
   * - BR-015: If Q_raw < MOQ, adjust to MOQ: Q1 = max(Q_raw, MOQ)
   * - BR-016: Round up to multiples of pack_size: Q_suggested = ceil(Q1 / pack_size) * pack_size
   *
   * @param rawShortage Nhu cầu thiếu hụt thô (Q_raw)
   * @param moq Số lượng đặt hàng tối thiểu (mặc định = 1)
   * @param packSize Quy cách đóng gói (mặc định = 1)
   * @returns Số lượng mua đề xuất đã làm tròn (Q_suggested)
   */
  public static calculateSuggestedQuantity(
    rawShortage: number,
    moq: number = 1,
    packSize: number = 1
  ): number {
    if (rawShortage <= 0) {
      return 0; // Tồn kho hiện tại và hàng đang về vẫn đáp ứng đủ, không cần đặt thêm
    }

    const effectiveMoq = Math.max(1, Math.floor(moq));
    const effectivePackSize = Math.max(1, Math.floor(packSize));

    // Bước 1: Áp dụng ràng buộc số lượng đặt tối thiểu MOQ (BR-015)
    const q1 = Math.max(rawShortage, effectiveMoq);

    // Bước 2: Làm tròn lên theo quy cách đóng gói (BR-016)
    const packs = Math.ceil(q1 / effectivePackSize);
    return packs * effectivePackSize;
  }
}
