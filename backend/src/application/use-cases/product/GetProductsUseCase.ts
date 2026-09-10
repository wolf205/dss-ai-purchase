import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductFilterDTO, ProductResponseDTO } from '../../dtos/ProductDTO';

export class GetProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(filter?: ProductFilterDTO): Promise<{ products: ProductResponseDTO[]; total: number }> {
    const page = Math.max(1, filter?.page ?? 1);
    const limit = Math.max(1, Math.min(100, filter?.limit ?? 20));
    const offset = (page - 1) * limit;

    const allowedSortFields = ['sku', 'name', 'category', 'costPrice', 'sellingPrice', 'createdAt'] as const;
    const sortBy = filter?.sortBy && allowedSortFields.includes(filter.sortBy as any)
      ? filter.sortBy
      : 'sku';
    const sortOrder = filter?.sortOrder === 'desc' ? 'desc' : 'asc';

    const cleanSearch = filter?.search?.trim() ? filter.search.trim() : undefined;
    const cleanCategory = filter?.category?.trim() ? filter.category.trim() : undefined;

    const result = await this.productRepository.findAll({
      category: cleanCategory,
      isActive: filter?.isActive,
      search: cleanSearch,
      limit,
      offset,
      sortBy,
      sortOrder,
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
