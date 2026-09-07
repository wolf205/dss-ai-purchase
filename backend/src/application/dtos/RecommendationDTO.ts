export interface RecommendedSupplierDTO {
  supplierId: number;
  name: string;
  unitPrice: number;
  moq: number;
  packSize: number;
  score: number;
  otif: number;
  leadTime: number;
}

export interface ExplanationFactorsDTO {
  rawShortage: number;
  moqApplied: number;
  packSizeApplied: number;
}

export interface PurchaseRecommendationItemDTO {
  id: number;
  sku: string;
  productName: string;
  category: string;
  onHand: number;
  onOrder: number;
  inventoryPosition: number;
  reorderPoint: number;
  daysOfSupply: number;
  urgencyLevel: string;
  suggestedQuantity: number;
  suggestedOrderDate: string;
  recommendedSupplier: RecommendedSupplierDTO | null;
  estimatedTotalCost: number;
  explanationSummary: string;
  explanationFactors: ExplanationFactorsDTO;
}

export interface RunAnalysisResultDTO {
  executionTimeMs: number;
  skusAnalyzed: number;
  recommendationsCount: number;
  message: string;
}
