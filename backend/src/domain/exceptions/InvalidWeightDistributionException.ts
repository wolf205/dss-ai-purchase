import { DomainException } from './DomainException';

export class InvalidWeightDistributionException extends DomainException {
  constructor(message: string = 'Tổng trọng số đánh giá nhà cung cấp phải bằng 1.00 (hoặc 100%)', details?: any) {
    super(message, 'WEIGHT_SUM_INVALID', details);
  }
}
