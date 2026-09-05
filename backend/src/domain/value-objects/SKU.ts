import { DomainException } from '../exceptions/DomainException';
export class SKU {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new DomainException('Mã SKU không được để trống', 'BUSINESS_RULE_VIOLATION');
    }

    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new DomainException('Mã SKU phải có độ dài từ 2 đến 50 ký tự', 'BUSINESS_RULE_VIOLATION');
    }

    // SKU must be alphanumeric with optional hyphens or underscores
    const skuRegex = /^[A-Z0-9_-]+$/;
    if (!skuRegex.test(trimmed)) {
      throw new DomainException('Mã SKU chỉ được chứa chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_)', 'BUSINESS_RULE_VIOLATION');
    }

    this._value = trimmed;
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: SKU | string): boolean {
    if (typeof other === 'string') {
      return this._value === other.trim().toUpperCase();
    }
    return other !== null && other !== undefined && this._value === other.value;
  }

  public toString(): string {
    return this._value;
  }
}
