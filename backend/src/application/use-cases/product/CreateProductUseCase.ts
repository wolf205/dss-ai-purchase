import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { CreateProductRequestDTO, ProductResponseDTO } from '../../dtos/ProductDTO';
import { Product } from '../../../domain/entities/Product';
import { Inventory } from '../../../domain/entities/Inventory';
import { ValidationException, DuplicateResourceException } from '../../exceptions';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  public async execute(
    dto: CreateProductRequestDTO,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<ProductResponseDTO> {
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

    try {
      const saved = await this.unitOfWork.executeInTransaction(async () => {
        const savedProduct = await this.productRepository.save(product);

        // Khởi tạo bản ghi tồn kho tương ứng bảo đảm toàn vẹn ACID (BR-001)
        const inventory = new Inventory({
          productSku: savedProduct.sku.value,
          onHand: 0,
          onOrder: 0,
          safetyStock: savedProduct.minSafetyStock,
        });
        await this.inventoryRepository.save(inventory);

        return savedProduct;
      });

      // Ghi nhận nhật ký kiểm toán tạo mới Master Data
      if (this.auditLogRepository) {
        await this.auditLogRepository.create({
          userId: operatorUserId,
          action: 'CREATE_PRODUCT',
          entityName: 'products',
          entityId: saved.sku.value,
          newValues: {
            name: saved.name,
            category: saved.category,
            unit: saved.unit,
            costPrice: saved.costPrice,
            sellingPrice: saved.sellingPrice,
            defaultLeadTime: saved.defaultLeadTime,
            minSafetyStock: saved.minSafetyStock,
          },
          ipAddress,
        });
      }

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
    } catch (err: any) {
      // Bắt lỗi CSDL P2002 nếu xảy ra race condition khi tạo trùng SKU
      if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
        throw new DuplicateResourceException('Mã SKU', trimmedSku);
      }
      throw err;
    }
  }
}
