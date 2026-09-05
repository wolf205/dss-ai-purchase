import { DomainException } from '../exceptions/DomainException';
import { RiskLevel, RiskLevelEnum } from '../value-objects/RiskLevel';

export interface InventoryProps {
  productSku: string;
  onHand?: number;
  onOrder?: number;
  calculatedIp?: number;
  safetyStock?: number;
  reorderPoint?: number;
  maxStock?: number;
  daysOfSupply?: number;
  riskLevel?: RiskLevelEnum | string;
  isDeadStock?: boolean;
  lastStocktakeDate?: Date | null;
  updatedAt?: Date;
}

export class Inventory {
  public readonly productSku: string;
  private _onHand: number;
  private _onOrder: number;
  private _safetyStock: number;
  private _reorderPoint: number;
  private _maxStock: number;
  private _daysOfSupply: number;
  private _riskLevel: RiskLevel;
  private _isDeadStock: boolean;
  private _lastStocktakeDate?: Date | null;
  private _updatedAt: Date;

  constructor(props: InventoryProps) {
    if (!props.productSku || !props.productSku.trim()) {
      throw new DomainException('Mã SKU sản phẩm không được để trống', 'BUSINESS_RULE_VIOLATION');
    }

    this.productSku = props.productSku.trim().toUpperCase();
    this._onHand = Math.max(0, props.onHand ?? 0);
    this._onOrder = Math.max(0, props.onOrder ?? 0);
    this._safetyStock = Math.max(0, props.safetyStock ?? 0);
    this._reorderPoint = Math.max(0, props.reorderPoint ?? 0);
    this._maxStock = Math.max(0, props.maxStock ?? 0);
    this._daysOfSupply = Math.max(0, props.daysOfSupply ?? 0);
    this._riskLevel = new RiskLevel(props.riskLevel ?? RiskLevelEnum.NORMAL);
    this._isDeadStock = props.isDeadStock ?? false;
    this._lastStocktakeDate = props.lastStocktakeDate;
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public get onHand(): number {
    return this._onHand;
  }

  public get onOrder(): number {
    return this._onOrder;
  }

  /**
   * Vị trí tồn kho IP = On-Hand + On-Order (BR-001)
   */
  public get calculatedIp(): number {
    return this._onHand + this._onOrder;
  }

  public get safetyStock(): number {
    return this._safetyStock;
  }

  public get reorderPoint(): number {
    return this._reorderPoint;
  }

  public get maxStock(): number {
    return this._maxStock;
  }

  public get daysOfSupply(): number {
    return this._daysOfSupply;
  }

  public get riskLevel(): RiskLevel {
    return this._riskLevel;
  }

  public get isDeadStock(): boolean {
    return this._isDeadStock;
  }

  public get lastStocktakeDate(): Date | null | undefined {
    return this._lastStocktakeDate;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateOnHand(newOnHand: number): void {
    if (newOnHand < 0) {
      throw new DomainException('Số lượng tồn kho thực tế (On-Hand) không được là số âm', 'BUSINESS_RULE_VIOLATION');
    }
    this._onHand = Math.floor(newOnHand);
    this.reevaluateRiskLevel();
    this._updatedAt = new Date();
  }

  public incrementOnHand(qty: number): void {
    if (qty < 0) throw new DomainException('Số lượng cộng thêm không được âm', 'BUSINESS_RULE_VIOLATION');
    this._onHand += Math.floor(qty);
    this.reevaluateRiskLevel();
    this._updatedAt = new Date();
  }

  public updateOnOrder(newOnOrder: number): void {
    if (newOnOrder < 0) {
      throw new DomainException('Số lượng hàng đang về (On-Order) không được là số âm', 'BUSINESS_RULE_VIOLATION');
    }
    this._onOrder = Math.floor(newOnOrder);
    this._updatedAt = new Date();
  }

  public updateDssParameters(params: {
    safetyStock?: number;
    reorderPoint?: number;
    maxStock?: number;
    daysOfSupply?: number;
    riskLevel?: RiskLevelEnum;
    isDeadStock?: boolean;
  }): void {
    if (params.safetyStock !== undefined) this._safetyStock = Math.max(0, params.safetyStock);
    if (params.reorderPoint !== undefined) this._reorderPoint = Math.max(0, params.reorderPoint);
    if (params.maxStock !== undefined) this._maxStock = Math.max(0, params.maxStock);
    if (params.daysOfSupply !== undefined) this._daysOfSupply = Math.max(0, params.daysOfSupply);
    if (params.riskLevel !== undefined) this._riskLevel = new RiskLevel(params.riskLevel);
    if (params.isDeadStock !== undefined) this._isDeadStock = params.isDeadStock;
    this._updatedAt = new Date();
  }

  private reevaluateRiskLevel(): void {
    if (this._onHand === 0) {
      this._riskLevel = new RiskLevel(RiskLevelEnum.OUT_OF_STOCK);
    } else if (this._safetyStock > 0 && this._onHand <= this._safetyStock) {
      this._riskLevel = new RiskLevel(RiskLevelEnum.CRITICAL);
    } else if (this._reorderPoint > 0 && this._onHand <= this._reorderPoint) {
      this._riskLevel = new RiskLevel(RiskLevelEnum.WARNING);
    } else if (this._reorderPoint > 0 && this._onHand > this._reorderPoint * 2) {
      this._riskLevel = new RiskLevel(RiskLevelEnum.OVERSTOCK);
    } else {
      this._riskLevel = new RiskLevel(RiskLevelEnum.NORMAL);
    }
  }
}
