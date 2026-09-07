import { RunDssAnalysisUseCase } from '../../../src/application/use-cases/recommendations/RunDssAnalysisUseCase';
import { Product } from '../../../src/domain/entities/Product';
import { Inventory } from '../../../src/domain/entities/Inventory';
import { Supplier } from '../../../src/domain/entities/Supplier';
import { ProductSupplier } from '../../../src/domain/entities/ProductSupplier';

describe('RunDssAnalysisUseCase', () => {
  let mockProductRepo: any;
  let mockInventoryRepo: any;
  let mockSalesRepo: any;
  let mockSupplierRepo: any;
  let mockDeliveryRepo: any;
  let mockWeightConfigRepo: any;
  let mockAiClient: any;
  let mockForecastRepo: any;
  let mockAbcXyzRepo: any;
  let mockRecommendationRepo: any;
  let mockColdStartRepo: any;
  let useCase: RunDssAnalysisUseCase;

  beforeEach(() => {
    mockProductRepo = {
      findAll: jest.fn(),
      findBySku: jest.fn(),
    };
    mockInventoryRepo = {
      findAll: jest.fn(),
      findByProductSku: jest.fn(),
      batchUpdateDss: jest.fn().mockResolvedValue(undefined),
    };
    mockSalesRepo = {
      getAll30DaysSalesStats: jest.fn(),
      getDailyAggregates: jest.fn(),
    };
    mockSupplierRepo = {
      findAllProductSuppliers: jest.fn(),
      findById: jest.fn(),
    };
    mockDeliveryRepo = {
      findRecentBySupplierId: jest.fn().mockResolvedValue([]),
    };
    mockWeightConfigRepo = {
      getLatest: jest.fn().mockResolvedValue(null),
    };
    mockAiClient = {
      getForecast: jest.fn(),
    };
    mockForecastRepo = {
      saveForecast: jest.fn().mockResolvedValue(undefined),
    };
    mockAbcXyzRepo = {
      saveBatch: jest.fn().mockResolvedValue(undefined),
    };
    mockRecommendationRepo = {
      clearPending: jest.fn().mockResolvedValue(undefined),
      saveBatch: jest.fn().mockResolvedValue(undefined),
    };
    mockColdStartRepo = {
      findBySku: jest.fn().mockResolvedValue(null),
    };

    useCase = new RunDssAnalysisUseCase(
      mockProductRepo,
      mockInventoryRepo,
      mockSalesRepo,
      mockSupplierRepo,
      mockDeliveryRepo,
      mockWeightConfigRepo,
      mockAiClient,
      mockForecastRepo,
      mockAbcXyzRepo,
      mockRecommendationRepo,
      mockColdStartRepo
    );
  });

  it('should return 0 analyzed SKUs if there are no active products', async () => {
    mockProductRepo.findAll.mockResolvedValue({ products: [], total: 0 });

    const result = await useCase.execute();

    expect(result.skusAnalyzed).toBe(0);
    expect(result.recommendationsCount).toBe(0);
  });

  it('should execute full DSS pipeline and generate recommendations when IP <= ROP', async () => {
    const product = new Product({
      sku: 'MILK-180',
      name: 'Sữa Vinamilk 180ml',
      category: 'Sữa',
      unit: 'Hộp',
      costPrice: 6000,
      sellingPrice: 8000,
      defaultLeadTime: 2,
      minSafetyStock: 10,
    });
    mockProductRepo.findAll.mockResolvedValue({ products: [product], total: 1 });

    mockSalesRepo.getAll30DaysSalesStats.mockResolvedValue([
      {
        productSku: 'MILK-180',
        totalRevenue: 5000000,
        meanDailyQuantity: 10,
        stdDevDailyQuantity: 2,
        historyDaysCount: 30,
      },
    ]);
    mockSalesRepo.getDailyAggregates.mockResolvedValue([
      { date: new Date('2026-09-01'), quantity: 10 },
      { date: new Date('2026-09-02'), quantity: 10 },
    ]);

    // AI forecast
    mockAiClient.getForecast.mockResolvedValue({
      sku: 'MILK-180',
      horizonDays: 14,
      forecastedDemand: 140,
      dailyAvgDemand: 10,
      wape: 15,
      mae: 1.5,
      algorithmUsed: 'AI_MODEL',
      isFallback: false,
      points: [],
    });

    // Inventory: On-Hand = 5, On-Order = 0 => IP = 5 (Well below ROP)
    const inventory = new Inventory({
      productSku: 'MILK-180',
      onHand: 5,
      onOrder: 0,
      safetyStock: 10,
      reorderPoint: 30,
    });
    mockInventoryRepo.findAll.mockResolvedValue({ inventories: [inventory], total: 1 });

    // Supplier
    const supplier = new Supplier({
      id: '1',
      code: 'SUP-01',
      name: 'Nhà phân phối sữa',
      phone: '0123456789',
      isActive: true,
    });
    mockSupplierRepo.findById.mockResolvedValue(supplier);

    const term = new ProductSupplier({
      productSku: 'MILK-180',
      supplierId: '1',
      purchasePrice: 6200,
      moq: 24,
      packSize: 12,
      committedLeadTime: 2,
      isPreferred: true,
    });
    mockSupplierRepo.findAllProductSuppliers.mockResolvedValue([term]);

    const result = await useCase.execute();

    expect(result.skusAnalyzed).toBe(1);
    expect(result.recommendationsCount).toBe(1);
    expect(mockAbcXyzRepo.saveBatch).toHaveBeenCalledTimes(1);
    expect(mockForecastRepo.saveForecast).toHaveBeenCalledTimes(1);
    expect(mockInventoryRepo.batchUpdateDss).toHaveBeenCalledTimes(1);
    expect(mockRecommendationRepo.clearPending).toHaveBeenCalledTimes(1);
    expect(mockRecommendationRepo.saveBatch).toHaveBeenCalledTimes(1);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
