import { Inventory } from '../entities/Inventory';

export interface InventoryFilterOptions {
  riskLevel?: string;
  isDeadStock?: boolean;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InventoryKpiSummary {
  totalSku: number;
  outOfStock: number;
  critical: number;
  warning: number;
  normal: number;
  overstock: number;
  deadStock: number;
}

export interface InventoryItemWithProduct {
  inventory: Inventory;
  productName: string;
  category: string;
  unit: string;
  costPrice: number;
}

export interface IInventoryRepository {
  findByProductSku(productSku: string): Promise<Inventory | null>;
  findAll(options?: InventoryFilterOptions): Promise<{ inventories: Inventory[]; total: number }>;
  findAllWithProducts(options?: InventoryFilterOptions): Promise<{ items: InventoryItemWithProduct[]; total: number }>;
  getKpiSummary(): Promise<InventoryKpiSummary>;
  save(inventory: Inventory): Promise<Inventory>;
  update(inventory: Inventory): Promise<Inventory>;
  updateOnHand(productSku: string, newOnHand: number, stocktakeDate?: Date): Promise<Inventory>;
  updateOnOrder(productSku: string, delta: number): Promise<Inventory>;
  batchUpdateDss(
    items: Array<{
      productSku: string;
      safetyStock: number;
      reorderPoint: number;
      maxStock: number;
      daysOfSupply: number;
      riskLevel: string;
      isDeadStock: boolean;
    }>
  ): Promise<void>;
}
