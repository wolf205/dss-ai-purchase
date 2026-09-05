import { Inventory } from '../entities/Inventory';

export interface InventoryFilterOptions {
  riskLevel?: string;
  isDeadStock?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IInventoryRepository {
  findByProductSku(productSku: string): Promise<Inventory | null>;
  findAll(options?: InventoryFilterOptions): Promise<{ inventories: Inventory[]; total: number }>;
  save(inventory: Inventory): Promise<Inventory>;
  update(inventory: Inventory): Promise<Inventory>;
  updateOnHand(productSku: string, newOnHand: number): Promise<Inventory>;
  updateOnOrder(productSku: string, delta: number): Promise<Inventory>;
}
