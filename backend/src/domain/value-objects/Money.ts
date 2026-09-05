export class Money {
  private readonly _amount: number;

  constructor(amount: number) {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      throw new Error('Số tiền không hợp lệ');
    }

    if (amount < 0) {
      throw new Error('Số tiền không được là số âm');
    }

    // Standardize to 2 decimal places max
    this._amount = Math.round(amount * 100) / 100;
  }

  public get amount(): number {
    return this._amount;
  }

  public add(other: Money | number): Money {
    const addVal = typeof other === 'number' ? other : other.amount;
    return new Money(this._amount + addVal);
  }

  public multiply(quantity: number): Money {
    if (quantity < 0) {
      throw new Error('Số lượng nhân không được âm');
    }
    return new Money(this._amount * quantity);
  }

  public formatVND(): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(this._amount);
  }

  public equals(other: Money | number): boolean {
    const otherVal = typeof other === 'number' ? other : other.amount;
    return Math.abs(this._amount - otherVal) < 0.001;
  }

  public toString(): string {
    return this._amount.toString();
  }
}
