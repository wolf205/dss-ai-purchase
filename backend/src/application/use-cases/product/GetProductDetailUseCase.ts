import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductResponseDTO } from '../../dtos/ProductDTO';
import { EntityNotFoundException } from '../../exceptions';

export class GetProductDetailUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(sku: string): Promise<ProductResponseDTO> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', sku);
    }

    return {
      sku: product.sku.value,
      name: product.name,
      category: product.category,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      defaultLeadTime: product.defaultLeadTime,
      minSafetyStock: product.minSafetyStock,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
