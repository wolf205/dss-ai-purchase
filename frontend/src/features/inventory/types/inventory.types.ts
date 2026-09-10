import { RiskLevel } from '../../../components/ui/Badge';

export interface KpiSummary {
  outOfStock: number;
  critical: number;
  warning: number;
  normal: number;
  overstock: number;
  deadStock: number;
}

export interface InventoryDashboardData {
  totalSku: number;
  kpiSummary: KpiSummary;
  riskDistributionPct: {
    safeRatio: number;
    atRiskRatio: number;
  };
}

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  onHand: number;
  onOrder: number;
  inventoryPosition: number;
  safetyStock: number;
  reorderPoint: number;
  maxStock: number;
  daysOfSupply: number;
  riskLevel: RiskLevel;
  isDeadStock: boolean;
  unit?: string;
  costPrice?: number;
  abcClass?: string;
  xyzClass?: string;
  abcXyzSegment?: string;
}

export interface Sku360Data {
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
    riskLevel: RiskLevel;
  };
  classification: {
    abcClass: string;
    xyzClass: string;
    segment: string;
    cv: number;
  };
  suppliers: Array<{
    supplierId: number;
    name: string;
    purchasePrice: number;
    moq: number;
    packSize: number;
    score: number;
    leadTime: number;
  }>;
  forecastPoints?: Array<{
    date: string;
    actual?: number | null;
    forecast?: number | null;
    lowerBound?: number | null;
    upperBound?: number | null;
  }>;
}
