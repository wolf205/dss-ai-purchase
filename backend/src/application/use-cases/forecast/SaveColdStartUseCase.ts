import { IColdStartRepository } from '../../../domain/repositories/IColdStartRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { InventoryCalculator } from '../../../domain/services/InventoryCalculator';
import { EntityNotFoundException, ValidationException } from '../../exceptions';
import { ColdStartInputDTO, ColdStartResponseDTO } from '../../dtos/ForecastDTO';

export class SaveColdStartUseCase {
  constructor(
    private readonly coldStartRepository: IColdStartRepository,
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  public async execute(input: ColdStartInputDTO): Promise<ColdStartResponseDTO> {
    const cleanSku = input.sku.trim().toUpperCase();

    if (!input.expectedDailySales || input.expectedDailySales <= 0) {
      throw new ValidationException('Lượng bán dự kiến ngày (expectedDailySales) phải là số nguyên dương > 0');
    }

    const product = await this.productRepository.findBySku(cleanSku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', cleanSku);
    }

    // Save cold start input
    await this.coldStartRepository.save({
      productSku: cleanSku,
      expectedDailySales: Math.round(input.expectedDailySales),
      historyDaysCount: 0,
      notes: input.notes,
      updatedBy: input.updatedBy,
    });

    // BR-003 Fallback: SS = ceil(dExpected * 2)
    const calculatedSafetyStock = InventoryCalculator.calculateSafetyStockColdStart(input.expectedDailySales);

    // Update inventory if exists
    const inventory = await this.inventoryRepository.findByProductSku(cleanSku);
    if (inventory) {
      inventory.updateDssParameters({ safetyStock: calculatedSafetyStock });
      await this.inventoryRepository.update(inventory);
    }

    return {
      sku: cleanSku,
      expectedDailySales: Math.round(input.expectedDailySales),
      calculatedSafetyStock,
      message: 'Đã lưu lượng bán dự kiến. Hệ thống đã cập nhật tồn kho an toàn ban đầu.',
    };
  }
}
