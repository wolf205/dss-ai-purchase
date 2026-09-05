import { DomainException } from '../exceptions/DomainException';
import { SKU } from '../value-objects/SKU';

export interface ProductProps {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime?: number;
  minSafetyStock?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  public readonly sku: SKU;
  private _name: string;
  private _category: string;
  private _unit: string;
  private _costPrice: number;
  private _sellingPrice: number;
  private _defaultLeadTime: number;
  private _minSafetyStock: number;
  private _isActive: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ProductProps) {
    this.sku = new SKU(props.sku);
    
    if (!props.name || !props.name.trim()) {
      throw new DomainException('Tên sản phẩm không được để trống', 'BUSINESS_RULE_VIOLATION');
    }
    if (!props.category || !props.category.trim()) {
      throw new DomainException('Danh mục sản phẩm không được để trống', 'BUSINESS_RULE_VIOLATION');
    }
    if (!props.unit || !props.unit.trim()) {
      throw new DomainException('Đơn vị tính không được để trống', 'BUSINESS_RULE_VIOLATION');
    }
    if (props.costPrice < 0) {
      throw new DomainException('Giá vốn không được là số âm', 'BUSINESS_RULE_VIOLATION');
    }
    if (props.sellingPrice < 0) {
      throw new DomainException('Giá bán không được là số âm', 'BUSINESS_RULE_VIOLATION');
    }

    this._name = props.name.trim();
    this._category = props.category.trim();
    this._unit = props.unit.trim();
    this._costPrice = props.costPrice;
    this._sellingPrice = props.sellingPrice;
    this._defaultLeadTime = Math.max(1, props.defaultLeadTime ?? 1);
    this._minSafetyStock = Math.max(0, props.minSafetyStock ?? 0);
    this._isActive = props.isActive ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public get name(): string {
    return this._name;
  }

  public get category(): string {
    return this._category;
  }

  public get unit(): string {
    return this._unit;
  }

  public get costPrice(): number {
    return this._costPrice;
  }

  public get sellingPrice(): number {
    return this._sellingPrice;
  }

  public get defaultLeadTime(): number {
    return this._defaultLeadTime;
  }

  public get minSafetyStock(): number {
    return this._minSafetyStock;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateInfo(params: {
    name?: string;
    category?: string;
    unit?: string;
    costPrice?: number;
    sellingPrice?: number;
    defaultLeadTime?: number;
    minSafetyStock?: number;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainException('Tên sản phẩm không được để trống', 'BUSINESS_RULE_VIOLATION');
      this._name = params.name.trim();
    }
    if (params.category !== undefined) {
      if (!params.category.trim()) throw new DomainException('Danh mục không được để trống', 'BUSINESS_RULE_VIOLATION');
      this._category = params.category.trim();
    }
    if (params.unit !== undefined) {
      if (!params.unit.trim()) throw new DomainException('Đơn vị tính không được để trống', 'BUSINESS_RULE_VIOLATION');
      this._unit = params.unit.trim();
    }
    if (params.costPrice !== undefined) {
      if (params.costPrice < 0) throw new DomainException('Giá vốn không được âm', 'BUSINESS_RULE_VIOLATION');
      this._costPrice = params.costPrice;
    }
    if (params.sellingPrice !== undefined) {
      if (params.sellingPrice < 0) throw new DomainException('Giá bán không được âm', 'BUSINESS_RULE_VIOLATION');
      this._sellingPrice = params.sellingPrice;
    }
    if (params.defaultLeadTime !== undefined) {
      this._defaultLeadTime = Math.max(1, params.defaultLeadTime);
    }
    if (params.minSafetyStock !== undefined) {
      this._minSafetyStock = Math.max(0, params.minSafetyStock);
    }
    this._updatedAt = new Date();
  }

  public setActiveStatus(isActive: boolean): void {
    this._isActive = isActive;
    this._updatedAt = new Date();
  }
}
