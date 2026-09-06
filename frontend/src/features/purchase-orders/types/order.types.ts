import { POStatus } from '../../../components/ui/Badge';

export interface POItem {
  id?: number;
  productSku: string;
  productName?: string;
  orderedQuantity: number;
  unitPrice: number;
  deliveredQuantity?: number;
  defectiveQuantity?: number;
}

export interface PurchaseOrder {
  id: number;
  poCode: string;
  supplierId: number;
  supplierName?: string;
  status: POStatus;
  orderDate: string;
  promisedDeliveryDate?: string;
  actualDeliveryDate?: string;
  totalAmount: number;
  itemCount?: number;
  notes?: string;
  items?: POItem[];
  createdAt?: string;
}

export interface CreatePOPayload {
  supplierId: number;
  promisedDeliveryDate?: string;
  notes?: string;
  items: Array<{
    productSku: string;
    orderedQuantity: number;
    unitPrice: number;
  }>;
}

export interface ReceiveItemPayload {
  sku: string;
  deliveredQuantity: number;
  defectiveQuantity: number;
}

export interface ReceiveGoodsPayload {
  actualDeliveryDate: string;
  notes?: string;
  items: ReceiveItemPayload[];
}
