import { InventoryCalculator } from '../../../src/domain/services/InventoryCalculator';
import { RiskLevelEnum } from '../../../src/domain/value-objects/RiskLevel';

describe('InventoryCalculator', () => {
  describe('calculateInventoryPosition (BR-001)', () => {
    it('should return correct inventory position', () => {
      expect(InventoryCalculator.calculateInventoryPosition(50, 20)).toBe(70);
      expect(InventoryCalculator.calculateInventoryPosition(0, 0)).toBe(0);
      expect(InventoryCalculator.calculateInventoryPosition(-10, 20)).toBe(10);
    });
  });

  describe('calculateSafetyStock (BR-003)', () => {
    it('should calculate SS correctly with Z=1.65 and round up', () => {
      // 1.65 * 10 * sqrt(4) = 1.65 * 10 * 2 = 33
      expect(InventoryCalculator.calculateSafetyStock(10, 4)).toBe(33);
      
      // 1.65 * 12.5 * sqrt(3) = 1.65 * 12.5 * 1.732 = 35.7225 -> 36
      expect(InventoryCalculator.calculateSafetyStock(12.5, 3)).toBe(36);
    });

    it('should respect minSafetyStock', () => {
      // 1.65 * 1 * sqrt(1) = 1.65 -> 2. But min is 5 -> 5
      expect(InventoryCalculator.calculateSafetyStock(1, 1, 5)).toBe(5);
    });
  });

  describe('calculateSafetyStockColdStart (BR-003 Fallback)', () => {
    it('should calculate SS for cold start correctly', () => {
      // 5.2 * 2 = 10.4 -> 11
      expect(InventoryCalculator.calculateSafetyStockColdStart(5.2)).toBe(11);
    });
  });

  describe('calculateReorderPoint (BR-004)', () => {
    it('should calculate ROP correctly and round up', () => {
      // 10.5 * 3 = 31.5 -> 31.5 + 20 = 51.5 -> Math.ceil(51.5) = 52
      expect(InventoryCalculator.calculateReorderPoint(10.5, 3, 20)).toBe(52);
    });
  });

  describe('calculateMaxStock (BR-004)', () => {
    it('should calculate Max Stock correctly', () => {
      // rop + ceil(dAvg * 30) = 50 + ceil(5.2 * 30) = 50 + ceil(156) = 206
      expect(InventoryCalculator.calculateMaxStock(50, 5.2)).toBe(206);
    });
  });

  describe('calculateDaysOfSupply (BR-005)', () => {
    it('should return 0 if onHand is 0 or negative', () => {
      expect(InventoryCalculator.calculateDaysOfSupply(0, 10)).toBe(0);
      expect(InventoryCalculator.calculateDaysOfSupply(-5, 10)).toBe(0);
    });

    it('should return 999 if dAvg is 0 (Dead Stock)', () => {
      expect(InventoryCalculator.calculateDaysOfSupply(50, 0)).toBe(999);
    });

    it('should calculate DoS correctly', () => {
      expect(InventoryCalculator.calculateDaysOfSupply(50, 10)).toBe(5);
      expect(InventoryCalculator.calculateDaysOfSupply(50, 20)).toBe(2.5);
    });
  });

  describe('isDeadStock (BR-023)', () => {
    it('should return true only if onHand > 0 and dAvg === 0', () => {
      expect(InventoryCalculator.isDeadStock(10, 0)).toBe(true);
      expect(InventoryCalculator.isDeadStock(0, 0)).toBe(false); // No stock, not dead stock, just empty
      expect(InventoryCalculator.isDeadStock(10, 1)).toBe(false); // Selling
    });
  });

  describe('evaluateRiskLevel (BR-002)', () => {
    it('should return OUT_OF_STOCK when onHand <= 0', () => {
      expect(InventoryCalculator.evaluateRiskLevel(20, 10, 30, 100, 0)).toBe(RiskLevelEnum.OUT_OF_STOCK);
      expect(InventoryCalculator.evaluateRiskLevel(20, 10, 30, 100, -5)).toBe(RiskLevelEnum.OUT_OF_STOCK);
    });

    it('should return CRITICAL when IP < SS', () => {
      expect(InventoryCalculator.evaluateRiskLevel(9, 10, 30, 100, 5)).toBe(RiskLevelEnum.CRITICAL);
    });

    it('should return WARNING when SS <= IP <= ROP', () => {
      expect(InventoryCalculator.evaluateRiskLevel(10, 10, 30, 100, 5)).toBe(RiskLevelEnum.WARNING);
      expect(InventoryCalculator.evaluateRiskLevel(25, 10, 30, 100, 5)).toBe(RiskLevelEnum.WARNING);
      expect(InventoryCalculator.evaluateRiskLevel(30, 10, 30, 100, 5)).toBe(RiskLevelEnum.WARNING);
    });

    it('should return OVERSTOCK when IP > MaxStock', () => {
      expect(InventoryCalculator.evaluateRiskLevel(101, 10, 30, 100, 5)).toBe(RiskLevelEnum.OVERSTOCK);
    });

    it('should return NORMAL when ROP < IP <= MaxStock', () => {
      expect(InventoryCalculator.evaluateRiskLevel(31, 10, 30, 100, 5)).toBe(RiskLevelEnum.NORMAL);
      expect(InventoryCalculator.evaluateRiskLevel(100, 10, 30, 100, 5)).toBe(RiskLevelEnum.NORMAL);
    });
  });
});
