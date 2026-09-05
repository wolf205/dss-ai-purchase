import { Product } from '../entities/Product';

export interface ProductFilterOptions {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IProductRepository {
  findBySku(sku: string): Promise<Product | null>;
  findAll(options?: ProductFilterOptions): Promise<{ products: Product[]; total: number }>;
  findAllCategories(): Promise<string[]>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  exists(sku: string): Promise<boolean>;
}
