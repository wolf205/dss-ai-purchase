export enum RiskLevelEnum {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  NORMAL = 'NORMAL',
  OVERSTOCK = 'OVERSTOCK',
}

export class RiskLevel {
  private readonly _value: RiskLevelEnum;

  constructor(value: RiskLevelEnum | string) {
    const upperValue = value.toUpperCase() as RiskLevelEnum;
    if (!Object.values(RiskLevelEnum).includes(upperValue)) {
      throw new Error(`Cấp độ rủi ro không hợp lệ: ${value}. Giá trị hợp lệ: OUT_OF_STOCK, CRITICAL, WARNING, NORMAL, OVERSTOCK`);
    }
    this._value = upperValue;
  }

  public get value(): RiskLevelEnum {
    return this._value;
  }

  public get isUrgent(): boolean {
    return this._value === RiskLevelEnum.OUT_OF_STOCK || this._value === RiskLevelEnum.CRITICAL;
  }

  public get labelVi(): string {
    switch (this._value) {
      case RiskLevelEnum.OUT_OF_STOCK:
        return 'Hết hàng';
      case RiskLevelEnum.CRITICAL:
        return 'Cực kỳ nguy cấp';
      case RiskLevelEnum.WARNING:
        return 'Cảnh báo sắp hết';
      case RiskLevelEnum.NORMAL:
        return 'An toàn';
      case RiskLevelEnum.OVERSTOCK:
        return 'Dư thừa tồn kho';
      default:
        return this._value;
    }
  }

  public equals(other: RiskLevel | string): boolean {
    if (typeof other === 'string') {
      return this._value === other.toUpperCase();
    }
    return other !== null && other !== undefined && this._value === other.value;
  }

  public toString(): string {
    return this._value;
  }
}
