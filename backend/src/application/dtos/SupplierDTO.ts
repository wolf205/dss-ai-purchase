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
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  statusTag: SupplierStatusTag;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierDetailResponseDTO extends SupplierResponseDTO {
  products: ProductSupplierTermsResponseDTO[];
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
  productName?: string;
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

export interface SupplierEvaluationScoresDTO {
  priceScore: number;
  otifScore: number;
  qualityScore: number;
  leadTimeScore: number;
}

export interface SupplierEvaluationItemDTO {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  deliveryCountAnalyzed: number;
  totalScore: number;
  rank: number;
  isNewSupplier: boolean;
  scores: SupplierEvaluationScoresDTO;
}

export interface SupplierDeliveryResponseDTO {
  id: number;
  poId: number;
  poCode: string;
  promisedDeliveryDate: string;
  actualDeliveryDate: string;
  leadTimeDays: number;
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  totalDefectiveQuantity: number;
  isOtif: boolean;
  notes: string | null;
  createdAt: string;
}

