import { GetAbcXyzMatrixUseCase } from '../../../src/application/use-cases/inventory/GetAbcXyzMatrixUseCase';
import { IAbcXyzAnalysisRepository } from '../../../src/domain/repositories/IAbcXyzAnalysisRepository';

describe('GetAbcXyzMatrixUseCase', () => {
  let mockAbcXyzRepo: jest.Mocked<IAbcXyzAnalysisRepository>;
  let useCase: GetAbcXyzMatrixUseCase;

  beforeEach(() => {
    mockAbcXyzRepo = {
      saveBatch: jest.fn(),
      getLatestMatrix: jest.fn(),
      findLatestBySku: jest.fn(),
      getAllLatest: jest.fn(),
    };

    useCase = new GetAbcXyzMatrixUseCase(mockAbcXyzRepo);
  });

  it('should return mapped 9-cell matrix with analysis date', async () => {
    mockAbcXyzRepo.getLatestMatrix.mockResolvedValue({
      AX: { skuCount: 15, revenuePct: 50.5 },
      AY: { skuCount: 10, revenuePct: 20.0 },
      AZ: { skuCount: 5, revenuePct: 5.0 },
      BX: { skuCount: 20, revenuePct: 10.0 },
      BY: { skuCount: 12, revenuePct: 5.0 },
      BZ: { skuCount: 8, revenuePct: 3.5 },
      CX: { skuCount: 25, revenuePct: 3.0 },
      CY: { skuCount: 18, revenuePct: 2.0 },
      CZ: { skuCount: 10, revenuePct: 1.0 },
    });

    const result = await useCase.execute();

    expect(result.matrix.AX.skuCount).toBe(15);
    expect(result.matrix.AX.revenuePct).toBe(50.5);
    expect(result.matrix.CZ.skuCount).toBe(10);
    expect(result.analysisDate).toBeDefined();
  });
});
