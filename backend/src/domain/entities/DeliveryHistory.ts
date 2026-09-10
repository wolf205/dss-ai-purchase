import { DomainException } from '../exceptions/DomainException';

export interface DeliveryHistoryProps {
  id?: bigint;
  orderId: bigint;
  poCode?: string;
  supplierId: bigint;
  orderDate?: Date;
  promisedDate: Date;
  actualDeliveryDate?: Date;
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  totalDefectiveQuantity?: number;
  totalAcceptedQuantity?: number;
  leadTimeDays?: number;
  isOnTime?: boolean;
  isInFull?: boolean;
  isOtif?: boolean;
  notes?: string | null;
  receivedBy: string; // UUID
  receivedAt?: Date;
}

export class DeliveryHistory {
  public readonly id?: bigint;
  public readonly orderId: bigint;
  public readonly poCode?: string;
  public readonly supplierId: bigint;
  public readonly promisedDate: Date;
  public readonly actualDeliveryDate: Date;
  public readonly totalOrderedQuantity: number;
  public readonly totalDeliveredQuantity: number;
  public readonly totalDefectiveQuantity: number;
  public readonly totalAcceptedQuantity: number;
  public readonly leadTimeDays: number;
  public readonly isOnTime: boolean;
  public readonly isInFull: boolean;
  public readonly isOtif: boolean;
  public readonly notes?: string | null;
  public readonly receivedBy: string;
  public readonly receivedAt: Date;

  constructor(props: DeliveryHistoryProps) {
    if (props.totalOrderedQuantity <= 0) {
      throw new DomainException('Tổng số lượng đặt mua phải lớn hơn 0', 'BUSINESS_RULE_VIOLATION');
    }
    if (props.totalDeliveredQuantity < 0) {
      throw new DomainException('Tổng số lượng giao không được âm', 'BUSINESS_RULE_VIOLATION');
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.poCode = props.poCode;
    this.supplierId = props.supplierId;
    this.promisedDate = props.promisedDate;
    this.actualDeliveryDate = props.actualDeliveryDate ?? new Date();
    
    // Convert to UTC dates for pure date comparison (no time parts)
    const promised = new Date(this.promisedDate.toISOString().split('T')[0]);
    const actual = new Date(this.actualDeliveryDate.toISOString().split('T')[0]);
    
    this.totalOrderedQuantity = props.totalOrderedQuantity;
    this.totalDeliveredQuantity = props.totalDeliveredQuantity;
    
    this.isOnTime = props.isOnTime !== undefined ? props.isOnTime : actual <= promised;
    this.isInFull = props.isInFull !== undefined ? props.isInFull : this.totalDeliveredQuantity >= this.totalOrderedQuantity;
    this.isOtif = props.isOtif !== undefined ? props.isOtif : (this.isOnTime && this.isInFull); // BR-012

    this.totalDefectiveQuantity = props.totalDefectiveQuantity ?? 0;
    if (this.totalDefectiveQuantity < 0) {
      throw new DomainException('Số lượng hàng lỗi không được âm', 'BUSINESS_RULE_VIOLATION');
    }
    if (this.totalDefectiveQuantity > this.totalDeliveredQuantity) {
      throw new DomainException('Số lượng hàng lỗi không thể lớn hơn số lượng giao', 'BUSINESS_RULE_VIOLATION');
    }

    this.totalAcceptedQuantity = props.totalAcceptedQuantity !== undefined
      ? props.totalAcceptedQuantity
      : (this.totalDeliveredQuantity - this.totalDefectiveQuantity);
    
    // Tính lead time theo ngày (ưu tiên giá trị đã lưu từ CSDL nếu có)
    if (props.leadTimeDays !== undefined) {
      this.leadTimeDays = props.leadTimeDays;
    } else {
      const orderD = new Date((props.orderDate ?? new Date()).toISOString().split('T')[0]);
      const diffTime = Math.abs(actual.getTime() - orderD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.leadTimeDays = diffDays;
    }
    
    this.notes = props.notes;
    this.receivedBy = props.receivedBy;
    this.receivedAt = props.receivedAt ?? new Date();
  }
}
