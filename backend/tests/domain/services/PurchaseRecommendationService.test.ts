import { PurchaseRecommendationService, SupplierOption } from '../../../src/domain/services/PurchaseRecommendationService';

describe('PurchaseRecommendationService', () => {
  const suppliers: SupplierOption[] = [
    {
      id: 'SUP-1',
      name: 'Supplier A',
      scoreResult: { totalScore: 80, otifScore: 80, qualityScore: 80, priceScore: 80, leadTimeScore: 80, isNewSupplier: false },
      averageLeadTimeDays: 3,
      supplierPrice: 10
    },
    {
      id: 'SUP-2',
      name: 'Supplier B',
      scoreResult: { totalScore: 80, otifScore: 80, qualityScore: 80, priceScore: 80, leadTimeScore: 80, isNewSupplier: false },
      averageLeadTimeDays: 3,
      supplierPrice: 9 // Rẻ hơn
    },
    {
      id: 'SUP-3',
      name: 'Supplier C',
      scoreResult: { totalScore: 90, otifScore: 90, qualityScore: 90, priceScore: 90, leadTimeScore: 90, isNewSupplier: false },
      averageLeadTimeDays: 5, // Điểm cao hơn nhưng lead time dài
      supplierPrice: 15
    },
  ];

  describe('selectOptimalSupplier (BR-016)', () => {
    it('should select supplier with highest score', () => {
      const selected = PurchaseRecommendationService.selectOptimalSupplier(suppliers);
      expect(selected?.id).toBe('SUP-3'); // Điểm 90 cao nhất
    });

    it('should fallback to shortest lead time then cheapest price if scores tie', () => {
      const tieSuppliers: SupplierOption[] = [suppliers[0], suppliers[1]];
      // SUP-1 và SUP-2 đều 80 điểm, đều leadtime 3, nhưng SUP-2 giá 9 rẻ hơn 10
      const selected = PurchaseRecommendationService.selectOptimalSupplier(tieSuppliers);
      expect(selected?.id).toBe('SUP-2');
    });
  });

  describe('generateRecommendation (BR-014, BR-015)', () => {
    it('should not recommend purchase if IP is sufficient', () => {
      const result = PurchaseRecommendationService.generateRecommendation(
        100, // Demand
        20,  // SS
        150, // IP
        30,  // ROP
        10,  // D_avg
        1,
        1,
        suppliers,
        '2026-09-06'
      );

      // Q_raw = 100 + 20 - 150 = -30 -> 0
      expect(result.rawShortage).toBe(-30);
      expect(result.suggestedQuantity).toBe(0);
      expect(result.insight).toBe('Tồn kho hiện tại vẫn đáp ứng đủ, không cần đặt thêm hàng.');
    });

    it('should calculate date and insight correctly when IP <= ROP', () => {
      const result = PurchaseRecommendationService.generateRecommendation(
        100, // Demand
        20,  // SS
        25,  // IP
        30,  // ROP
        10,  // D_avg
        5,   // MOQ
        6,   // PackSize
        suppliers,
        '2026-09-06'
      );

      // Q_raw = 100 + 20 - 25 = 95
      // Q1 = max(95, MOQ=5) = 95
      // Packs = ceil(95/6) = 16 -> Q_suggested = 16 * 6 = 96
      expect(result.rawShortage).toBe(95);
      expect(result.suggestedQuantity).toBe(96);
      expect(result.daysUntilReorder).toBe(0);
      expect(result.suggestedOrderDate).toBe('2026-09-06');
      expect(result.insight).toContain('Đề xuất đặt mua GẤP 96 sản phẩm (16 lốc/thùng) từ NCC Supplier C vì tồn kho đã chạm ngưỡng ROP.');
    });

    it('should calculate date correctly when IP > ROP', () => {
      const result = PurchaseRecommendationService.generateRecommendation(
        100, // Demand
        20,  // SS
        60,  // IP
        30,  // ROP
        10,  // D_avg
        1,   // MOQ
        1,   // PackSize
        suppliers,
        '2026-09-06'
      );

      // IP - ROP = 30. D_avg = 10. -> 3 days until reorder
      expect(result.daysUntilReorder).toBe(3);
      expect(result.suggestedOrderDate).toBe('2026-09-09');
      expect(result.insight).toContain('sau 3 ngày nữa');
    });
  });
});
