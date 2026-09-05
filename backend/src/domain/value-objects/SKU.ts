export class SKU {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('Mã SKU không được để trống');
    }

    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new Error('Mã SKU phải có độ dài từ 2 đến 50 ký tự');
    }

    // SKU must be alphanumeric with optional hyphens or underscores
    const skuRegex = /^[A-Z0-9_-]+$/;
    if (!skuRegex.test(trimmed)) {
      throw new Error('Mã SKU chỉ được chứa chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_)');
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
