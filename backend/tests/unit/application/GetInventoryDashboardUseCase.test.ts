import { GetInventoryDashboardUseCase } from '../../../src/application/use-cases/inventory/GetInventoryDashboardUseCase';
import { IInventoryRepository } from '../../../src/domain/repositories/IInventoryRepository';

describe('GetInventoryDashboardUseCase', () => {
  let mockInventoryRepo: jest.Mocked<IInventoryRepository>;
  let useCase: GetInventoryDashboardUseCase;

  beforeEach(() => {
    mockInventoryRepo = {
      findByProductSku: jest.fn(),
      findAll: jest.fn(),
      findAllWithProducts: jest.fn(),
      getKpiSummary: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateOnHand: jest.fn(),
      updateOnOrder: jest.fn(),
      batchUpdateDss: jest.fn(),
    };

    useCase = new GetInventoryDashboardUseCase(mockInventoryRepo);
  });

  it('should calculate safeRatio and atRiskRatio correctly from KPI summary', async () => {
    mockInventoryRepo.getKpiSummary.mockResolvedValue({
      totalSku: 100,
      outOfStock: 5,
      critical: 10,
      warning: 15,
      normal: 60,
      overstock: 10,
      deadStock: 2,
    });

    const result = await useCase.execute();

    expect(result.totalSku).toBe(100);
    expect(result.kpiSummary.outOfStock).toBe(5);
    expect(result.kpiSummary.normal).toBe(60);
    // safeCount = 60, atRiskCount = 5 + 10 + 15 + 10 = 40. Total = 100
    // safeRatio = 60%, atRiskRatio = 40%
    expect(result.riskDistributionPct.safeRatio).toBe(60);
    expect(result.riskDistributionPct.atRiskRatio).toBe(40);
  });

  it('should handle zero SKU gracefully', async () => {
    mockInventoryRepo.getKpiSummary.mockResolvedValue({
      totalSku: 0,
      outOfStock: 0,
      critical: 0,
      warning: 0,
      normal: 0,
      overstock: 0,
      deadStock: 0,
    });

    const result = await useCase.execute();

    expect(result.totalSku).toBe(0);
    expect(result.riskDistributionPct.safeRatio).toBe(100);
    expect(result.riskDistributionPct.atRiskRatio).toBe(0);
  });
});
