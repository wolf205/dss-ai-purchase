/**
 * Domain Service: ABCXYZClassifier
 * Phân loại sản phẩm theo ma trận 9 ô ABC-XYZ (BR-009, BR-010, BR-011)
 */
export class ABCXYZClassifier {
  /**
   * BR-009: Phân loại Ma trận ABC theo Doanh thu
   * @param items Danh sách sản phẩm và doanh thu 30 ngày
   * @returns Bản đồ ánh xạ ID sản phẩm với nhãn A, B, C
   */
  public static classifyABC(items: Array<{ id: string; revenue: number }>): Map<string, 'A' | 'B' | 'C'> {
    const result = new Map<string, 'A' | 'B' | 'C'>();
    if (items.length === 0) return result;

    // Tính tổng doanh thu toàn cửa hàng (chỉ tính phần >= 0)
    const totalRevenue = items.reduce((sum, item) => sum + Math.max(0, item.revenue), 0);
    
    // Sắp xếp giảm dần theo doanh thu
    const sorted = [...items].sort((a, b) => b.revenue - a.revenue);
    
    let cumulativeRevenue = 0;
    
    for (const item of sorted) {
      if (totalRevenue === 0) {
        // Nếu toàn bộ cửa hàng không có doanh thu, xếp tất cả vào C
        result.set(item.id, 'C');
        continue;
      }
      
      const itemRevenue = Math.max(0, item.revenue);
      const prevCumulativePercent = cumulativeRevenue / totalRevenue;
      cumulativeRevenue += itemRevenue;
      
      // Nhóm A (<= 80%)
      if (prevCumulativePercent < 0.8) {
        result.set(item.id, 'A');
      } 
      // Nhóm B (80% - 95%)
      else if (prevCumulativePercent < 0.95) {
        result.set(item.id, 'B');
      } 
      // Nhóm C (> 95%)
      else {
        result.set(item.id, 'C');
      }
    }
    
    return result;
  }

  /**
   * BR-010: Phân loại Ma trận XYZ theo Độ ổn định Nhu cầu (Hệ số biến thiên CV)
   * @param stdDev Độ lệch chuẩn lượng bán hàng ngày
   * @param mean Nhu cầu bán trung bình ngày
   * @returns Nhãn X, Y, Z
   */
  public static classifyXYZ(stdDev: number, mean: number): 'X' | 'Y' | 'Z' {
    if (mean === 0) {
      // Hàng không có giao dịch (Dead Stock), biến động lớn nhất
      return 'Z';
    }
    
    const cv = stdDev / mean;
    if (cv <= 0.5) {
      return 'X';
    } else if (cv <= 1.0) {
      return 'Y';
    } else {
      return 'Z';
    }
  }

  /**
   * BR-011: Lấy phân loại tổ hợp Ma trận 9 ô
   */
  public static getMatrixCategory(abc: 'A' | 'B' | 'C', xyz: 'X' | 'Y' | 'Z'): string {
    return `${abc}${xyz}`;
  }
}
