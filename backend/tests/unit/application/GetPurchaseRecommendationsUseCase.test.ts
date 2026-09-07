import { GetPurchaseRecommendationsUseCase } from '../../../src/application/use-cases/recommendations/GetPurchaseRecommendationsUseCase';
import { IPurchaseRecommendationRepository } from '../../../src/domain/repositories/IPurchaseRecommendationRepository';

describe('GetPurchaseRecommendationsUseCase', () => {
  let mockRecommendationRepo: jest.Mocked<IPurchaseRecommendationRepository>;
  let useCase: GetPurchaseRecommendationsUseCase;

  beforeEach(() => {
    mockRecommendationRepo = {
      saveBatch: jest.fn(),
      findAllPending: jest.fn(),
      clearPending: jest.fn(),
    };

    useCase = new GetPurchaseRecommendationsUseCase(mockRecommendationRepo);
  });

  it('should return pending recommendations from repository', async () => {
    mockRecommendationRepo.findAllPending.mockResolvedValue([
      {
        id: 101,
        sku: 'MILK-VNM-180',
        productName: 'Sữa tươi Vinamilk',
        category: 'Sữa',
        onHand: 10,
        onOrder: 0,
        inventoryPosition: 10,
        reorderPoint: 35,
        daysOfSupply: 2.0,
        urgencyLevel: 'CRITICAL',
        suggestedQuantity: 72,
        suggestedOrderDate: '2026-09-07',
        recommendedSupplier: {
          supplierId: 1,
          name: 'Vinamilk',
          unitPrice: 6200,
          moq: 24,
          packSize: 12,
          score: 92.5,
          otif: 90.0,
          leadTime: 2,
        },
        estimatedTotalCost: 446400,
        explanationSummary: 'Tồn kho thấp hơn ROP',
        explanationFactors: { rawShortage: 68, moqApplied: 24, packSizeApplied: 12 },
      },
    ]);

    const result = await useCase.execute();

    expect(result.length).toBe(1);
    expect(result[0].sku).toBe('MILK-VNM-180');
    expect(result[0].suggestedQuantity).toBe(72);
    expect(result[0].recommendedSupplier?.name).toBe('Vinamilk');
  });
});
