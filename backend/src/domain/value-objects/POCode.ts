import { DomainException } from '../exceptions/DomainException';
export class POCode {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new DomainException('Mã đơn hàng PO không được để trống', 'BUSINESS_RULE_VIOLATION');
    }

    const trimmed = value.trim().toUpperCase();
    // Format PO-YYYYMMDD-XXXX (e.g. PO-20260904-0001)
    const poRegex = /^PO-\d{8}-[A-Z0-9]{4}$/;
    if (!poRegex.test(trimmed)) {
      throw new DomainException('Mã đơn hàng PO không đúng định dạng chuẩn PO-YYYYMMDD-XXXX (ví dụ: PO-20260904-0001)', 'BUSINESS_RULE_VIOLATION');
    }

    this._value = trimmed;
  }

  public get value(): string {
    return this._value;
  }

  public static generate(date: Date, sequenceNumber: number): POCode {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const seq = sequenceNumber.toString().padStart(4, '0');
    return new POCode(`PO-${yyyy}${mm}${dd}-${seq}`);
  }

  public equals(other: POCode | string): boolean {
    if (typeof other === 'string') {
      return this._value === other.trim().toUpperCase();
    }
    return other !== null && other !== undefined && this._value === other.value;
  }

  public toString(): string {
    return this._value;
  }
}
