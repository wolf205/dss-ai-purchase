export interface Product {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime: number;
  minSafetyStock: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime: number;
  minSafetyStock: number;
}

export interface UpdateProductPayload {
  name?: string;
  category?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  defaultLeadTime?: number;
  minSafetyStock?: number;
  isActive?: boolean;
}
