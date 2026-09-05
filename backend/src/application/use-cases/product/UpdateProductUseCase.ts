import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { UpdateProductRequestDTO, ProductResponseDTO } from '../../dtos/ProductDTO';
import { ValidationException } from '../../../domain/exceptions/ValidationException';

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(sku: string, dto: UpdateProductRequestDTO): Promise<ProductResponseDTO> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new ValidationException(`Không tìm thấy sản phẩm với mã SKU: ${sku}`);
    }

    product.updateInfo({
      name: dto.name,
      category: dto.category,
      unit: dto.unit,
      costPrice: dto.costPrice,
      sellingPrice: dto.sellingPrice,
      defaultLeadTime: dto.defaultLeadTime,
      minSafetyStock: dto.minSafetyStock,
    });

    if (dto.isActive !== undefined) {
      product.setActiveStatus(dto.isActive);
    }

    const updated = await this.productRepository.update(product);

    return {
      sku: updated.sku.value,
      name: updated.name,
      category: updated.category,
      unit: updated.unit,
      costPrice: updated.costPrice,
      sellingPrice: updated.sellingPrice,
      defaultLeadTime: updated.defaultLeadTime,
      minSafetyStock: updated.minSafetyStock,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
