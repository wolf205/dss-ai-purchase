import { IInventoryRepository, InventoryFilterOptions } from '../../../domain/repositories/IInventoryRepository';
import { InventoryItemDTO } from '../../dtos/InventoryDTO';

export class GetInventoryItemsUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  public async execute(
    options?: InventoryFilterOptions
  ): Promise<{ items: InventoryItemDTO[]; total: number }> {
    const { items, total } = await this.inventoryRepository.findAllWithProducts(options);

    const mappedItems: InventoryItemDTO[] = items.map((item) => ({
      sku: item.inventory.productSku,
      name: item.productName,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice,
      onHand: item.inventory.onHand,
      onOrder: item.inventory.onOrder,
      inventoryPosition: item.inventory.calculatedIp,
      safetyStock: item.inventory.safetyStock,
      reorderPoint: item.inventory.reorderPoint,
      maxStock: item.inventory.maxStock,
      daysOfSupply: item.inventory.daysOfSupply,
      riskLevel: item.inventory.riskLevel.value,
      isDeadStock: item.inventory.isDeadStock,
    }));

    return { items: mappedItems, total };
  }
}
