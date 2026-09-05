import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductFilterDTO, ProductResponseDTO } from '../../dtos/ProductDTO';

export class GetProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(filter?: ProductFilterDTO): Promise<{ products: ProductResponseDTO[]; total: number }> {
    const page = Math.max(1, filter?.page ?? 1);
    const limit = Math.max(1, Math.min(100, filter?.limit ?? 20));
    const offset = (page - 1) * limit;

    const result = await this.productRepository.findAll({
      category: filter?.category,
      isActive: filter?.isActive,
      search: filter?.search,
      limit,
      offset,
    });

    return {
      products: result.products.map((p) => ({
        sku: p.sku.value,
        name: p.name,
        category: p.category,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        defaultLeadTime: p.defaultLeadTime,
        minSafetyStock: p.minSafetyStock,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total: result.total,
    };
  }

  public async getCategories(): Promise<string[]> {
    return await this.productRepository.findAllCategories();
  }
}
