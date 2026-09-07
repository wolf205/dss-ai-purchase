import { SaveColdStartUseCase } from '../../../src/application/use-cases/forecast/SaveColdStartUseCase';
import { IColdStartRepository } from '../../../src/domain/repositories/IColdStartRepository';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../src/domain/repositories/IInventoryRepository';
import { Product } from '../../../src/domain/entities/Product';
import { Inventory } from '../../../src/domain/entities/Inventory';
import { ValidationException, EntityNotFoundException } from '../../../src/application/exceptions';

describe('SaveColdStartUseCase', () => {
  let mockColdStartRepo: jest.Mocked<IColdStartRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockInventoryRepo: jest.Mocked<IInventoryRepository>;
  let useCase: SaveColdStartUseCase;

  beforeEach(() => {
    mockColdStartRepo = {
      save: jest.fn(),
      findBySku: jest.fn(),
      findAll: jest.fn(),
    };
    mockProductRepo = {
      findBySku: jest.fn(),
      findAll: jest.fn(),
      findAllCategories: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      exists: jest.fn(),
    };
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

    useCase = new SaveColdStartUseCase(mockColdStartRepo, mockProductRepo, mockInventoryRepo);
  });

  it('should calculate Safety Stock = dExpected * 2 and save cold start', async () => {
    const product = new Product({
      sku: 'NEW-PROD-01',
      name: 'Sản phẩm mới',
      category: 'Bánh kẹo',
      unit: 'Gói',
      costPrice: 5000,
      sellingPrice: 8000,
    });
    mockProductRepo.findBySku.mockResolvedValue(product);

    const inventory = new Inventory({
      productSku: 'NEW-PROD-01',
      onHand: 10,
    });
    mockInventoryRepo.findByProductSku.mockResolvedValue(inventory);

    const result = await useCase.execute({
      sku: 'NEW-PROD-01',
      expectedDailySales: 8,
      notes: 'Hàng mới thử nghiệm',
    });

    expect(result.sku).toBe('NEW-PROD-01');
    expect(result.expectedDailySales).toBe(8);
    // BR-003: SS = ceil(dExpected * 2) = 16
    expect(result.calculatedSafetyStock).toBe(16);
    expect(mockColdStartRepo.save).toHaveBeenCalledTimes(1);
    expect(mockInventoryRepo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw ValidationException if expectedDailySales <= 0', async () => {
    await expect(
      useCase.execute({
        sku: 'NEW-PROD-01',
        expectedDailySales: 0,
      })
    ).rejects.toThrow(ValidationException);
  });

  it('should throw EntityNotFoundException if product does not exist', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);

    await expect(
      useCase.execute({
        sku: 'UNKNOWN-SKU',
        expectedDailySales: 5,
      })
    ).rejects.toThrow(EntityNotFoundException);
  });
});
