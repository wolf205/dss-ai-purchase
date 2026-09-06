import { PurchaseOrder } from '../entities/PurchaseOrder';

export interface IPurchaseOrderRepository {
  findById(id: bigint): Promise<PurchaseOrder | null>;
  findByCode(poCode: string): Promise<PurchaseOrder | null>;
  save(order: PurchaseOrder): Promise<void>;
  update(order: PurchaseOrder): Promise<void>;
  countPOsInDate(date: Date): Promise<number>;
  // Các hàm khác phục vụ cho GetPurchaseOrdersUseCase
  findAll(filters: any): Promise<PurchaseOrder[]>;
}
