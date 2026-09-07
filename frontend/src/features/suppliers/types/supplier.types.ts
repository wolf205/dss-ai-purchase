export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  statusTag: string;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
}

export interface SupplierEvaluation {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  deliveryCountAnalyzed: number;
  totalScore: number;
  rank: number;
  isNewSupplier: boolean;
  scores: {
    priceScore: number;
    otifScore: number;
    qualityScore: number;
    leadTimeScore: number;
  };
}

export interface SupplierWeightConfig {
  weightOtif: number;
  weightQuality: number;
  weightPrice: number;
  weightLeadTime: number;
}
