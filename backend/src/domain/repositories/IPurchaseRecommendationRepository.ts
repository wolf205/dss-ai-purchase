export interface PurchaseRecommendationRecord {
  id?: bigint;
  productSku: string;
  recommendedSupplierId: bigint | null;
  horizonDays: number;
  onHandAtEval: number;
  onOrderAtEval: number;
  forecastedDemand: number;
  safetyStock: number;
  rawShortage: number;
  suggestedQuantity: number;
  suggestedOrderDate: Date;
  estimatedUnitPrice: number | null;
  estimatedTotalCost: number | null;
  urgencyLevel: string;
  explanationSummary: string;
  explanationFactors: any;
  status?: string;
  createdAt?: Date;
}

export interface RecommendationFilterOptions {
  horizonDays?: number;
  urgencyLevel?: string;
  category?: string;
}

export interface IPurchaseRecommendationRepository {
  saveBatch(recommendations: PurchaseRecommendationRecord[]): Promise<void>;
  findAllPending(options?: RecommendationFilterOptions): Promise<any[]>;
  clearPending(): Promise<void>;
}
