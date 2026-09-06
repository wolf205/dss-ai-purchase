import { RiskLevel } from '../../../components/ui/Badge';

export interface RecommendedSupplierInfo {
  supplierId: number;
  name: string;
  unitPrice: number;
  moq: number;
  packSize: number;
  score: number;
  otif: number;
  leadTime: number;
}

export interface ExplanationFactors {
  rawShortage: number;
  moqApplied: number;
  packSizeApplied: number;
}

export interface RecommendationItem {
  id: number;
  sku: string;
  productName: string;
  category: string;
  onHand: number;
  onOrder: number;
  inventoryPosition: number;
  reorderPoint: number;
  daysOfSupply: number;
  urgencyLevel: RiskLevel;
  suggestedQuantity: number;
  suggestedOrderDate: string;
  recommendedSupplier: RecommendedSupplierInfo;
  estimatedTotalCost: number;
  explanationSummary: string;
  explanationFactors: ExplanationFactors;
}

export interface RunAnalysisResult {
  executionTimeMs: number;
  skusAnalyzed: number;
  recommendationsCount: number;
  message: string;
}
