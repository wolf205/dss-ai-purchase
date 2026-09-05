import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { CreateProductRequestDTO, ProductResponseDTO } from '../../dtos/ProductDTO';
import { Product } from '../../../domain/entities/Product';
import { Inventory } from '../../../domain/entities/Inventory';
import { ValidationException, DuplicateResourceException } from '../../exceptions';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  public async execute(dto: CreateProductRequestDTO): Promise<ProductResponseDTO> {
    if (!dto.sku || !dto.name || !dto.category || !dto.unit) {
      throw new ValidationException('Vui lòng nhập đầy đủ các trường thông tin sản phẩm bắt buộc');
    }

    const trimmedSku = dto.sku.trim().toUpperCase();
    const existing = await this.productRepository.findBySku(trimmedSku);
    if (existing) {
      throw new DuplicateResourceException('Mã SKU', trimmedSku);
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

    const saved = await this.unitOfWork.executeInTransaction(async () => {
      const savedProduct = await this.productRepository.save(product);

      // Initialize inventory for this product
      const inventory = new Inventory({
        productSku: savedProduct.sku.value,
        onHand: 0,
        onOrder: 0,
        safetyStock: savedProduct.minSafetyStock,
      });
      await this.inventoryRepository.save(inventory);
      
      return savedProduct;
    });

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
