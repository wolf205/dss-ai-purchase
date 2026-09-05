import { WeightDistribution } from '../../../src/domain/value-objects/WeightDistribution';

describe('WeightDistribution Value Object (BR-013, UC-017)', () => {
  it('should create valid WeightDistribution when sum is 1.00', () => {
    const weights = new WeightDistribution(0.35, 0.25, 0.20, 0.20);
    expect(weights.weightPrice).toBe(0.35);
    expect(weights.weightOtif).toBe(0.25);
    expect(weights.weightQuality).toBe(0.20);
    expect(weights.weightLeadTime).toBe(0.20);
  });

  it('should normalize percentage input (sum = 100) to decimal (sum = 1.00)', () => {
    const weights = new WeightDistribution(35, 25, 20, 20);
    expect(weights.weightPrice).toBe(0.35);
    expect(weights.weightOtif).toBe(0.25);
    expect(weights.weightQuality).toBe(0.20);
    expect(weights.weightLeadTime).toBe(0.20);
  });

  it('should throw error when sum does not equal 1.00 or 100%', () => {
    expect(() => new WeightDistribution(0.40, 0.30, 0.20, 0.20)).toThrow(
      'Tổng các trọng số đánh giá phải bằng 1.00 (hoặc 100%)'
    );
  });

  it('should throw error when any weight is negative', () => {
    expect(() => new WeightDistribution(-0.10, 0.50, 0.30, 0.30)).toThrow(
      'Trọng số đánh giá nhà cung cấp không được âm'
    );
  });
});
