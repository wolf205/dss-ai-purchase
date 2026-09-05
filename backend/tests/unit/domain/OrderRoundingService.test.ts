import { OrderRoundingService } from '../../../src/domain/services/OrderRoundingService';

describe('OrderRoundingService (BR-014, BR-015, BR-016)', () => {
  it('should return 0 if raw shortage is zero or negative', () => {
    expect(OrderRoundingService.calculateSuggestedQuantity(0, 10, 1)).toBe(0);
    expect(OrderRoundingService.calculateSuggestedQuantity(-5, 10, 5)).toBe(0);
  });

  it('should apply MOQ when raw shortage is less than MOQ (BR-015)', () => {
    // rawShortage = 15, MOQ = 20, PackSize = 1 -> Q1 = 20 -> Q_suggested = 20
    expect(OrderRoundingService.calculateSuggestedQuantity(15, 20, 1)).toBe(20);
  });

  it('should keep raw shortage when raw shortage is greater than MOQ', () => {
    // rawShortage = 25, MOQ = 20, PackSize = 1 -> Q1 = 25 -> Q_suggested = 25
    expect(OrderRoundingService.calculateSuggestedQuantity(25, 20, 1)).toBe(25);
  });

  it('should round up to the nearest multiple of pack_size (BR-016)', () => {
    // rawShortage = 21, MOQ = 1, PackSize = 12 (Thùng 12) -> ceil(21/12)*12 = 2 * 12 = 24
    expect(OrderRoundingService.calculateSuggestedQuantity(21, 1, 12)).toBe(24);

    // rawShortage = 24, MOQ = 1, PackSize = 12 -> 24
    expect(OrderRoundingService.calculateSuggestedQuantity(24, 1, 12)).toBe(24);

    // rawShortage = 25, MOQ = 1, PackSize = 12 -> 36
    expect(OrderRoundingService.calculateSuggestedQuantity(25, 1, 12)).toBe(36);
  });

  it('should handle combination of MOQ and PackSize correctly', () => {
    // rawShortage = 5, MOQ = 30, PackSize = 12
    // Step 1: max(5, 30) = 30
    // Step 2: ceil(30 / 12) * 12 = 3 * 12 = 36
    expect(OrderRoundingService.calculateSuggestedQuantity(5, 30, 12)).toBe(36);
  });
});
