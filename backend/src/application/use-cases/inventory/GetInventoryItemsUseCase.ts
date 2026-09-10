import { IInventoryRepository, InventoryFilterOptions } from '../../../domain/repositories/IInventoryRepository';
import { IAbcXyzAnalysisRepository } from '../../../domain/repositories/IAbcXyzAnalysisRepository';
import { InventoryItemDTO } from '../../dtos/InventoryDTO';

export class GetInventoryItemsUseCase {
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly abcXyzAnalysisRepository?: IAbcXyzAnalysisRepository
  ) {}

  public async execute(
    options?: InventoryFilterOptions
  ): Promise<{ items: InventoryItemDTO[]; total: number }> {
    const [{ items, total }, latestAnalysis] = await Promise.all([
      this.inventoryRepository.findAllWithProducts(options),
      this.abcXyzAnalysisRepository ? this.abcXyzAnalysisRepository.getAllLatest() : Promise.resolve([]),
    ]);

    const abcXyzMap = new Map(latestAnalysis.map((a) => [a.productSku, a]));

    const mappedItems: InventoryItemDTO[] = items.map((item) => {
      const abcInfo = abcXyzMap.get(item.inventory.productSku);
      return {
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
        abcClass: abcInfo?.abcClass,
        xyzClass: abcInfo?.xyzClass,
        abcXyzSegment: abcInfo?.abcXyzSegment,
      };
    });

    return { items: mappedItems, total };
  }
}

