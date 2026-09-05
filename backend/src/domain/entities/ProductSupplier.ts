export interface ProductSupplierProps {
  id?: string;
  productSku: string;
  supplierId: string;
  purchasePrice: number;
  moq?: number;
  packSize?: number;
  committedLeadTime?: number;
  isPreferred?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductSupplier {
  public readonly id?: string;
  public readonly productSku: string;
  public readonly supplierId: string;
  private _purchasePrice: number;
  private _moq: number;
  private _packSize: number;
  private _committedLeadTime: number;
  private _isPreferred: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ProductSupplierProps) {
    if (!props.productSku || !props.productSku.trim()) {
      throw new Error('Mã SKU sản phẩm không được để trống');
    }
    if (!props.supplierId || !props.supplierId.trim()) {
      throw new Error('Mã ID nhà cung cấp không được để trống');
    }
    if (props.purchasePrice < 0) {
      throw new Error('Giá nhập không được là số âm');
    }

    this.id = props.id;
    this.productSku = props.productSku.trim().toUpperCase();
    this.supplierId = props.supplierId.trim();
    this._purchasePrice = props.purchasePrice;
    this._moq = Math.max(1, Math.floor(props.moq ?? 1));
    this._packSize = Math.max(1, Math.floor(props.packSize ?? 1));
    this._committedLeadTime = Math.max(1, Math.floor(props.committedLeadTime ?? 1));
    this._isPreferred = props.isPreferred ?? false;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public get purchasePrice(): number {
    return this._purchasePrice;
  }

  public get moq(): number {
    return this._moq;
  }

  public get packSize(): number {
    return this._packSize;
  }

  public get committedLeadTime(): number {
    return this._committedLeadTime;
  }

  public get isPreferred(): boolean {
    return this._isPreferred;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateTerms(params: {
    purchasePrice?: number;
    moq?: number;
    packSize?: number;
    committedLeadTime?: number;
    isPreferred?: boolean;
  }): void {
    if (params.purchasePrice !== undefined) {
      if (params.purchasePrice < 0) throw new Error('Giá nhập không được âm');
      this._purchasePrice = params.purchasePrice;
    }
    if (params.moq !== undefined) {
      this._moq = Math.max(1, Math.floor(params.moq));
    }
    if (params.packSize !== undefined) {
      this._packSize = Math.max(1, Math.floor(params.packSize));
    }
    if (params.committedLeadTime !== undefined) {
      this._committedLeadTime = Math.max(1, Math.floor(params.committedLeadTime));
    }
    if (params.isPreferred !== undefined) {
      this._isPreferred = params.isPreferred;
    }
    this._updatedAt = new Date();
  }
}
