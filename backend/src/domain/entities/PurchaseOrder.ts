import { DomainException } from '../exceptions/DomainException';
import { InvalidOrderStateException } from '../exceptions/InvalidOrderStateException';
import { POCode } from '../value-objects/POCode';
import { SKU } from '../value-objects/SKU';
import { Money } from '../value-objects/Money';

export type POStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItemProps {
  id?: bigint;
  orderId?: bigint;
  productSku: string | SKU;
  orderedQuantity: number;
  unitPrice: number | Money;
  totalPrice?: number | Money;
  deliveredQuantity?: number;
  defectiveQuantity?: number;
  acceptedQuantity?: number;
  createdAt?: Date;
}

export class PurchaseOrderItem {
  public readonly id?: bigint;
  public readonly orderId?: bigint;
  private _productSku: SKU;
  private _orderedQuantity: number;
  private _unitPrice: Money;
  private _totalPrice: Money;
  private _deliveredQuantity: number;
  private _defectiveQuantity: number;
  private _acceptedQuantity: number;
  public readonly createdAt: Date;

  constructor(props: PurchaseOrderItemProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this._productSku = props.productSku instanceof SKU ? props.productSku : new SKU(props.productSku);
    
    if (props.orderedQuantity <= 0) {
      throw new DomainException('Số lượng đặt mua phải lớn hơn 0', 'BUSINESS_RULE_VIOLATION');
    }
    this._orderedQuantity = props.orderedQuantity;
    this._unitPrice = props.unitPrice instanceof Money ? props.unitPrice : new Money(props.unitPrice);
    
    // Calculate total if not provided
    this._totalPrice = props.totalPrice !== undefined 
      ? (props.totalPrice instanceof Money ? props.totalPrice : new Money(props.totalPrice))
      : this._unitPrice.multiply(this._orderedQuantity);

    this._deliveredQuantity = props.deliveredQuantity ?? 0;
    this._defectiveQuantity = props.defectiveQuantity ?? 0;
    this._acceptedQuantity = props.acceptedQuantity ?? 0;
    this.createdAt = props.createdAt ?? new Date();
  }

  // getters
  public get productSku(): SKU { return this._productSku; }
  public get orderedQuantity(): number { return this._orderedQuantity; }
  public get unitPrice(): Money { return this._unitPrice; }
  public get totalPrice(): Money { return this._totalPrice; }
  public get deliveredQuantity(): number { return this._deliveredQuantity; }
  public get defectiveQuantity(): number { return this._defectiveQuantity; }
  public get acceptedQuantity(): number { return this._acceptedQuantity; }

  public updateOrderedQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new DomainException('Số lượng đặt mua phải lớn hơn 0', 'BUSINESS_RULE_VIOLATION');
    }
    this._orderedQuantity = quantity;
    this._totalPrice = this._unitPrice.multiply(this._orderedQuantity);
  }

  public updateUnitPrice(price: Money | number): void {
    this._unitPrice = price instanceof Money ? price : new Money(price);
    this._totalPrice = this._unitPrice.multiply(this._orderedQuantity);
  }

  public receive(deliveredQuantity: number, defectiveQuantity: number): void {
    if (deliveredQuantity < 0 || defectiveQuantity < 0) {
      throw new DomainException('Số lượng nhận và lỗi phải là số không âm', 'BUSINESS_RULE_VIOLATION');
    }
    if (defectiveQuantity > deliveredQuantity) {
      throw new DomainException('Số lượng hàng lỗi không thể lớn hơn số lượng thực giao', 'BUSINESS_RULE_VIOLATION');
    }
    this._deliveredQuantity = deliveredQuantity;
    this._defectiveQuantity = defectiveQuantity;
    this._acceptedQuantity = deliveredQuantity - defectiveQuantity;
  }
}

export interface PurchaseOrderProps {
  id?: bigint;
  poCode: string | POCode;
  supplierId: bigint;
  status?: POStatus;
  orderDate?: Date;
  promisedDeliveryDate: Date;
  actualDeliveryDate?: Date | null;
  totalAmount?: number | Money;
  notes?: string | null;
  createdBy: string; // UUID
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
  cancelledBy?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  items?: PurchaseOrderItem[];
}

export class PurchaseOrder {
  public readonly id?: bigint;
  private _poCode: POCode;
  private _supplierId: bigint;
  private _status: POStatus;
  private _orderDate: Date;
  private _promisedDeliveryDate: Date;
  private _actualDeliveryDate?: Date | null;
  private _totalAmount: Money;
  private _notes?: string | null;
  private _createdBy: string;
  private _confirmedBy?: string | null;
  private _confirmedAt?: Date | null;
  private _cancelledBy?: string | null;
  private _cancelledAt?: Date | null;
  private _cancellationReason?: string | null;
  public readonly createdAt: Date;
  private _updatedAt: Date;
  
  private _items: PurchaseOrderItem[];

  constructor(props: PurchaseOrderProps) {
    this.id = props.id;
    this._poCode = props.poCode instanceof POCode ? props.poCode : new POCode(props.poCode);
    this._supplierId = props.supplierId;
    this._status = props.status ?? 'DRAFT';
    this._orderDate = props.orderDate ?? new Date();
    
    // Promised delivery date validation
    const orderDateOnly = new Date(this._orderDate.toISOString().split('T')[0]);
    const promisedDateOnly = new Date(props.promisedDeliveryDate.toISOString().split('T')[0]);
    if (promisedDateOnly < orderDateOnly) {
      throw new DomainException('Ngày hẹn giao hàng không thể trước ngày tạo đơn', 'BUSINESS_RULE_VIOLATION');
    }
    this._promisedDeliveryDate = props.promisedDeliveryDate;
    
    this._actualDeliveryDate = props.actualDeliveryDate;
    this._notes = props.notes;
    this._createdBy = props.createdBy;
    this._confirmedBy = props.confirmedBy;
    this._confirmedAt = props.confirmedAt;
    this._cancelledBy = props.cancelledBy;
    this._cancelledAt = props.cancelledAt;
    this._cancellationReason = props.cancellationReason;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    this._items = props.items ?? [];
    this._totalAmount = props.totalAmount !== undefined 
      ? (props.totalAmount instanceof Money ? props.totalAmount : new Money(props.totalAmount))
      : this.calculateTotalAmount();
  }

  // getters
  public get poCode(): POCode { return this._poCode; }
  public get supplierId(): bigint { return this._supplierId; }
  public get status(): POStatus { return this._status; }
  public get orderDate(): Date { return this._orderDate; }
  public get promisedDeliveryDate(): Date { return this._promisedDeliveryDate; }
  public get actualDeliveryDate(): Date | null | undefined { return this._actualDeliveryDate; }
  public get totalAmount(): Money { return this._totalAmount; }
  public get notes(): string | null | undefined { return this._notes; }
  public get createdBy(): string { return this._createdBy; }
  public get confirmedBy(): string | null | undefined { return this._confirmedBy; }
  public get confirmedAt(): Date | null | undefined { return this._confirmedAt; }
  public get cancelledBy(): string | null | undefined { return this._cancelledBy; }
  public get cancelledAt(): Date | null | undefined { return this._cancelledAt; }
  public get cancellationReason(): string | null | undefined { return this._cancellationReason; }
  public get updatedAt(): Date { return this._updatedAt; }
  public get items(): ReadonlyArray<PurchaseOrderItem> { return this._items; }

  private calculateTotalAmount(): Money {
    const total = this._items.reduce((sum, item) => sum + item.totalPrice.amount, 0);
    return new Money(total);
  }

  private requireStatus(expectedStatus: POStatus | POStatus[]): void {
    const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    if (!statuses.includes(this._status)) {
      throw new InvalidOrderStateException(`Không thể thực hiện thao tác khi đơn hàng ở trạng thái ${this._status}`);
    }
  }

  // Thêm sản phẩm vào đơn hàng
  public addItem(item: PurchaseOrderItem): void {
    this.requireStatus('DRAFT');
    
    // Check if SKU already exists
    const existingIndex = this._items.findIndex(i => i.productSku.equals(item.productSku));
    if (existingIndex >= 0) {
      throw new DomainException('Sản phẩm đã tồn tại trong đơn hàng, vui lòng chỉnh sửa số lượng thay vì thêm mới', 'BUSINESS_RULE_VIOLATION');
    }

    this._items.push(item);
    this._totalAmount = this.calculateTotalAmount();
    this._updatedAt = new Date();
  }

  public removeItem(sku: string | SKU): void {
    this.requireStatus('DRAFT');
    const skuObj = sku instanceof SKU ? sku : new SKU(sku);
    this._items = this._items.filter(item => !item.productSku.equals(skuObj));
    this._totalAmount = this.calculateTotalAmount();
    this._updatedAt = new Date();
  }

  public updateItem(sku: string | SKU, quantity: number, unitPrice?: number | Money): void {
    this.requireStatus('DRAFT');
    const skuObj = sku instanceof SKU ? sku : new SKU(sku);
    const item = this._items.find(i => i.productSku.equals(skuObj));
    if (!item) {
      throw new DomainException('Không tìm thấy sản phẩm trong đơn hàng', 'RESOURCE_NOT_FOUND');
    }

    item.updateOrderedQuantity(quantity);
    if (unitPrice !== undefined) {
      item.updateUnitPrice(unitPrice);
    }
    
    this._totalAmount = this.calculateTotalAmount();
    this._updatedAt = new Date();
  }

  // UC-012: Xác nhận đặt hàng
  public confirmOrder(confirmedBy: string): void {
    this.requireStatus('DRAFT');
    if (this._items.length === 0) {
      throw new DomainException('Đơn mua hàng phải có ít nhất 1 sản phẩm', 'BUSINESS_RULE_VIOLATION');
    }

    this._status = 'ORDERED';
    this._confirmedBy = confirmedBy;
    this._confirmedAt = new Date();
    this._updatedAt = new Date();
  }

  // UC-013: Hủy đơn hàng
  public cancelOrder(cancelledBy: string, reason: string): void {
    this.requireStatus('ORDERED');
    if (!reason || !reason.trim()) {
      throw new DomainException('Bắt buộc phải nhập lý do hủy đơn', 'BUSINESS_RULE_VIOLATION');
    }

    this._status = 'CANCELLED';
    this._cancelledBy = cancelledBy;
    this._cancelledAt = new Date();
    this._cancellationReason = reason.trim();
    this._updatedAt = new Date();
  }

  // UC-014: Ghi nhận nhận hàng
  public receiveGoods(actualDeliveryDate: Date, itemsDeliveryData: { sku: string, deliveredQty: number, defectiveQty: number }[]): void {
    this.requireStatus('ORDERED');
    
    for (const data of itemsDeliveryData) {
      const item = this._items.find(i => i.productSku.equals(data.sku));
      if (!item) {
        throw new DomainException(`Không tìm thấy sản phẩm ${data.sku} trong đơn hàng`, 'RESOURCE_NOT_FOUND');
      }
      item.receive(data.deliveredQty, data.defectiveQty);
    }

    this._actualDeliveryDate = actualDeliveryDate;
    this._status = 'RECEIVED';
    this._updatedAt = new Date();
  }
}
