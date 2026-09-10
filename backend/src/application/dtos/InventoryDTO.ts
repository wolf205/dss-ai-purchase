export interface InventoryDashboardDTO {
  totalSku: number;
  kpiSummary: {
    outOfStock: number;
    critical: number;
    warning: number;
    normal: number;
    overstock: number;
    deadStock: number;
  };
  riskDistributionPct: {
    safeRatio: number;
    atRiskRatio: number;
  };
}

export interface InventoryItemDTO {
  sku: string;
  name: string;
  category: string;
  unit?: string;
  costPrice?: number;
  onHand: number;
  onOrder: number;
  inventoryPosition: number;
  safetyStock: number;
  reorderPoint: number;
  maxStock: number;
  daysOfSupply: number;
  riskLevel: string;
  isDeadStock: boolean;
  abcClass?: string;
  xyzClass?: string;
  abcXyzSegment?: string;
}

export interface MatrixCellDTO {
  segment?: string;
  skuCount: number;
  revenuePct: number;
}

export interface AbcXyzMatrixDTO {
  matrix: Record<string, MatrixCellDTO>;
  analysisDate: string;
}

export interface Product360SupplierDTO {
  supplierId: number;
  name: string;
  purchasePrice: number;
  moq: number;
  packSize: number;
  score: number;
  leadTime: number;
  isPreferred?: boolean;
}

export interface Product360ForecastPointDTO {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface Product360DTO {
  sku: string;
  name: string;
  category: string;
  inventory: {
    onHand: number;
    onOrder: number;
    ip: number;
    rop: number;
    ss: number;
    dos: number;
    riskLevel: string;
  };
  classification: {
    abcClass: string;
    xyzClass: string;
    segment: string;
    cv: number;
  };
  suppliers: Product360SupplierDTO[];
  forecastPoints?: Product360ForecastPointDTO[];
}
