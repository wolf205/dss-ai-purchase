import { SupplierStatusTag } from '../../domain/entities/Supplier';

export interface CreateSupplierRequestDTO {
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  statusTag?: SupplierStatusTag;
}

export interface UpdateSupplierRequestDTO {
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  statusTag?: SupplierStatusTag;
  isActive?: boolean;
}

export interface SupplierResponseDTO {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  statusTag: SupplierStatusTag;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetProductSupplierTermsRequestDTO {
  productSku: string;
  supplierId: string;
  purchasePrice: number;
  moq?: number;
  packSize?: number;
  committedLeadTime?: number;
  isPreferred?: boolean;
}

export interface ProductSupplierTermsResponseDTO {
  id: string;
  productSku: string;
  supplierId: string;
  purchasePrice: number;
  moq: number;
  packSize: number;
  committedLeadTime: number;
  isPreferred: boolean;
  supplierName?: string;
  supplierCode?: string;
}

export interface UpdateSupplierWeightsRequestDTO {
  weightPrice: number;
  weightOtif: number;
  weightQuality: number;
  weightLeadTime: number;
}

export interface SupplierWeightsResponseDTO {
  id: number;
  weightPrice: number;
  weightOtif: number;
  weightQuality: number;
  weightLeadTime: number;
  updatedBy?: string | null;
  updatedAt: Date;
}
