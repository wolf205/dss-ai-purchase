export interface CreatePurchaseOrderItemDto {
  productSku: string;
  orderedQuantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: bigint;
  promisedDeliveryDate: Date;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
  createdBy: string; // UUID of the user creating the PO
}

export interface PurchaseOrderItemResponseDto {
  id?: string; // bigint to string
  productSku: string;
  orderedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveredQuantity: number;
  defectiveQuantity: number;
  acceptedQuantity: number;
}

export interface PurchaseOrderResponseDto {
  id?: string; // bigint to string
  poCode: string;
  supplierId: string; // bigint to string
  status: string;
  orderDate: Date;
  promisedDeliveryDate: Date;
  actualDeliveryDate?: Date | null;
  totalAmount: number;
  notes?: string | null;
  createdBy: string;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
  cancelledBy?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  items: PurchaseOrderItemResponseDto[];
}

export interface ReceiveGoodsItemDto {
  productSku: string;
  deliveredQuantity: number;
  defectiveQuantity: number;
}

export interface ReceiveGoodsDto {
  poId: bigint;
  actualDeliveryDate: Date;
  receivedBy: string; // UUID
  notes?: string;
  items: ReceiveGoodsItemDto[];
}

export interface ConfirmPurchaseOrderDto {
  poId: bigint;
  confirmedBy: string; // UUID
}
