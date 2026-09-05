import { SKU } from '../../../src/domain/value-objects/SKU';
import { POCode } from '../../../src/domain/value-objects/POCode';

describe('SKU & POCode Value Objects (BR-011, BR-024)', () => {
  describe('SKU', () => {
    it('should create valid uppercase SKU', () => {
      const validSku = new SKU('hao-hao-tom-chua-cay_01');
      expect(validSku.value).toBe('HAO-HAO-TOM-CHUA-CAY_01');
    });

    it('should throw error for empty SKU or invalid characters', () => {
      expect(() => new SKU('')).toThrow('Mã SKU không được để trống');
      expect(() => new SKU('SKU with spaces')).toThrow('Mã SKU chỉ được chứa');
      expect(() => new SKU('A')).toThrow('Mã SKU phải có độ dài từ 2 đến 50 ký tự');
    });
  });

  describe('POCode (BR-024)', () => {
    it('should generate valid PO code with format PO-YYYYMMDD-XXXX', () => {
      const date = new Date(2026, 8, 4); // September 4, 2026
      const poCode = POCode.generate(date, 1);
      expect(poCode.value).toBe('PO-20260904-0001');
    });

    it('should throw error for invalid PO code format', () => {
      expect(() => new POCode('INVALID-PO-CODE')).toThrow('Mã đơn hàng PO không đúng định dạng');
      expect(() => new POCode('PO-202609-001')).toThrow('Mã đơn hàng PO không đúng định dạng');
    });
  });
});
