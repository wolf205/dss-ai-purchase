import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { CreateProductRequestDTO, ProductResponseDTO } from '../../dtos/ProductDTO';
import { Product } from '../../../domain/entities/Product';
import { Inventory } from '../../../domain/entities/Inventory';
import { ValidationException } from '../../../domain/exceptions/ValidationException';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  public async execute(dto: CreateProductRequestDTO): Promise<ProductResponseDTO> {
    if (!dto.sku || !dto.name || !dto.category || !dto.unit) {
      throw new ValidationException('Vui lòng nhập đầy đủ các trường thông tin sản phẩm bắt buộc');
    }

    const trimmedSku = dto.sku.trim().toUpperCase();
    const existing = await this.productRepository.findBySku(trimmedSku);
    if (existing) {
      throw new ValidationException(`Mã SKU "${trimmedSku}" đã tồn tại trên hệ thống (BR-011)`);
    }

    const product = new Product({
      sku: trimmedSku,
      name: dto.name,
      category: dto.category,
      unit: dto.unit,
      costPrice: dto.costPrice,
      sellingPrice: dto.sellingPrice,
      defaultLeadTime: dto.defaultLeadTime,
      minSafetyStock: dto.minSafetyStock,
    });

    const saved = await this.productRepository.save(product);

    // Initialize inventory for this product
    const inventory = new Inventory({
      productSku: saved.sku.value,
      onHand: 0,
      onOrder: 0,
      safetyStock: saved.minSafetyStock,
    });
    await this.inventoryRepository.save(inventory);

    return {
      sku: saved.sku.value,
      name: saved.name,
      category: saved.category,
      unit: saved.unit,
      costPrice: saved.costPrice,
      sellingPrice: saved.sellingPrice,
      defaultLeadTime: saved.defaultLeadTime,
      minSafetyStock: saved.minSafetyStock,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
