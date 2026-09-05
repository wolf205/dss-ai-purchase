import { UpdateSupplierWeightsUseCase } from '../../../src/application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { ISupplierWeightConfigRepository } from '../../../src/domain/repositories/ISupplierWeightConfigRepository';
import { InvalidWeightDistributionException } from '../../../src/domain/exceptions/InvalidWeightDistributionException';

describe('UpdateSupplierWeightsUseCase (UC-017, BR-013)', () => {
  let mockRepo: jest.Mocked<ISupplierWeightConfigRepository>;
  let useCase: UpdateSupplierWeightsUseCase;

  beforeEach(() => {
    mockRepo = {
      getLatest: jest.fn(),
      save: jest.fn().mockImplementation((config) => Promise.resolve(config)),
    };
    useCase = new UpdateSupplierWeightsUseCase(mockRepo);
  });

  it('should update weights successfully when sum equals 1.00', async () => {
    const result = await useCase.execute(
      {
        weightPrice: 0.35,
        weightOtif: 0.25,
        weightQuality: 0.20,
        weightLeadTime: 0.20,
      },
      'admin-id-123'
    );

    expect(result.weightPrice).toBe(0.35);
    expect(result.weightOtif).toBe(0.25);
    expect(result.weightQuality).toBe(0.20);
    expect(result.weightLeadTime).toBe(0.20);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw InvalidWeightDistributionException with code SUPPLIER_WEIGHTS_INVALID_SUM when sum is not 1.00', async () => {
    await expect(
      useCase.execute(
        {
          weightPrice: 0.50,
          weightOtif: 0.50,
          weightQuality: 0.20,
          weightLeadTime: 0.20,
        },
        'admin-id-123'
      )
    ).rejects.toThrow(InvalidWeightDistributionException);
  });
});
