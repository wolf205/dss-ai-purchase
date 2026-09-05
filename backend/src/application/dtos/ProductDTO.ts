export interface CreateProductRequestDTO {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime?: number;
  minSafetyStock?: number;
}

export interface UpdateProductRequestDTO {
  name?: string;
  category?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  defaultLeadTime?: number;
  minSafetyStock?: number;
  isActive?: boolean;
}

export interface ProductResponseDTO {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime: number;
  minSafetyStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilterDTO {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
