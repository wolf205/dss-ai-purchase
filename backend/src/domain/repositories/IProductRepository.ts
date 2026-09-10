import { Product } from '../entities/Product';

export type ProductSortField = 'sku' | 'name' | 'category' | 'costPrice' | 'sellingPrice' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilterOptions {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
}

export interface IProductRepository {
  findBySku(sku: string): Promise<Product | null>;
  findAll(options?: ProductFilterOptions): Promise<{ products: Product[]; total: number }>;
  findAllCategories(): Promise<string[]>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  exists(sku: string): Promise<boolean>;
  findBySkus(skus: string[]): Promise<Product[]>;
}
