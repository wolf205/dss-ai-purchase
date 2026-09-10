import { Supplier } from '../entities/Supplier';
import { ProductSupplier } from '../entities/ProductSupplier';

export interface SupplierFilterOptions {
  statusTag?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'code' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  findByCode(code: string): Promise<Supplier | null>;
  findByName(name: string): Promise<Supplier | null>;
  findAll(options?: SupplierFilterOptions): Promise<{ suppliers: Supplier[]; total: number }>;
  save(supplier: Supplier): Promise<Supplier>;
  update(supplier: Supplier): Promise<Supplier>;
  
  // Product-Supplier price terms (ProductSupplier)
  findProductSupplier(productSku: string, supplierId: string): Promise<ProductSupplier | null>;
  findSuppliersByProductSku(productSku: string): Promise<{ supplier: Supplier; terms: ProductSupplier }[]>;
  findAllProductSuppliers(): Promise<ProductSupplier[]>;
  findProductSuppliersBySupplierId(supplierId: string): Promise<ProductSupplier[]>;
  saveProductSupplier(terms: ProductSupplier): Promise<ProductSupplier>;
  updateProductSupplier(terms: ProductSupplier): Promise<ProductSupplier>;
  deleteProductSupplier(productSku: string, supplierId: string): Promise<boolean>;
}

