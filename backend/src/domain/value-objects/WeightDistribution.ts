import { DomainException } from '../exceptions/DomainException';
export class WeightDistribution {
  public readonly weightPrice: number;
  public readonly weightOtif: number;
  public readonly weightQuality: number;
  public readonly weightLeadTime: number;

  constructor(
    weightPrice: number,
    weightOtif: number,
    weightQuality: number,
    weightLeadTime: number
  ) {
    if (
      typeof weightPrice !== 'number' ||
      typeof weightOtif !== 'number' ||
      typeof weightQuality !== 'number' ||
      typeof weightLeadTime !== 'number'
    ) {
      throw new DomainException('Các giá trị trọng số phải là kiểu số', 'BUSINESS_RULE_VIOLATION');
    }

    if (weightPrice < 0 || weightOtif < 0 || weightQuality < 0 || weightLeadTime < 0) {
      throw new DomainException('Trọng số đánh giá nhà cung cấp không được âm', 'BUSINESS_RULE_VIOLATION');
    }

    const sum = weightPrice + weightOtif + weightQuality + weightLeadTime;
    // Allow slight floating point tolerance: |sum - 1.0| <= 0.001 (or sum === 100)
    const normalizedSum = Math.abs(sum - 1.0) < 0.001 ? 1.0 : sum;
    if (Math.abs(normalizedSum - 1.0) >= 0.001 && Math.abs(sum - 100.0) >= 0.001) {
      throw new DomainException(`Tổng các trọng số đánh giá phải bằng 1.00 (hoặc 100%). Hiện tại tổng là: ${sum}`, 'BUSINESS_RULE_VIOLATION');
    }

    if (Math.abs(sum - 100.0) < 0.001) {
      this.weightPrice = Math.round((weightPrice / 100) * 1000) / 1000;
      this.weightOtif = Math.round((weightOtif / 100) * 1000) / 1000;
      this.weightQuality = Math.round((weightQuality / 100) * 1000) / 1000;
      this.weightLeadTime = Math.round((weightLeadTime / 100) * 1000) / 1000;
    } else {
      this.weightPrice = weightPrice;
      this.weightOtif = weightOtif;
      this.weightQuality = weightQuality;
      this.weightLeadTime = weightLeadTime;
    }
  }

  public static defaultWeights(): WeightDistribution {
    return new WeightDistribution(0.35, 0.25, 0.20, 0.20);
  }

  public toArray(): [number, number, number, number] {
    return [this.weightPrice, this.weightOtif, this.weightQuality, this.weightLeadTime];
  }
}
