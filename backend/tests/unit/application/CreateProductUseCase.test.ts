import { CreateProductUseCase } from '../../../src/application/use-cases/product/CreateProductUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../src/domain/repositories/IInventoryRepository';
import { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository';
import { IUnitOfWork } from '../../../src/application/ports/IUnitOfWork';
import { Product } from '../../../src/domain/entities/Product';
import { Inventory } from '../../../src/domain/entities/Inventory';
import { ValidationException, DuplicateResourceException } from '../../../src/application/exceptions';
import { CreateProductRequestDTO } from '../../../src/application/dtos/ProductDTO';

describe('CreateProductUseCase (UC-001 / FR-001, FR-003, BR-001)', () => {
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockInventoryRepo: jest.Mocked<IInventoryRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let useCase: CreateProductUseCase;

  const validDto: CreateProductRequestDTO = {
    sku: 'MILK-TH-180',
    name: 'Sữa tươi TH True Milk 180ml',
    category: 'Sữa & Bơ sữa',
    unit: 'Hộp',
    costPrice: 7000,
    sellingPrice: 9000,
    defaultLeadTime: 2,
    minSafetyStock: 15,
  };

  beforeEach(() => {
    mockProductRepo = {
      findBySku: jest.fn(),
      findAll: jest.fn(),
      findAllCategories: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      exists: jest.fn(),
      findBySkus: jest.fn(),
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
    mockUnitOfWork = {
      executeInTransaction: jest.fn().mockImplementation(async (work) => work()),
    };
    mockAuditLogRepo = {
      create: jest.fn(),
    };

    useCase = new CreateProductUseCase(
      mockProductRepo,
      mockInventoryRepo,
      mockUnitOfWork,
      mockAuditLogRepo
    );
  });

  it('should create a product, initialize inventory, and record audit log in transaction (BR-001)', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);
    mockProductRepo.save.mockImplementation(async (p: Product) => p);
    mockInventoryRepo.save.mockImplementation(async (inv: Inventory) => inv);

    const result = await useCase.execute(validDto, 'user-admin-1', '192.168.1.10');

    expect(mockProductRepo.findBySku).toHaveBeenCalledWith('MILK-TH-180');
    expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    expect(mockProductRepo.save).toHaveBeenCalled();
    const savedInventory = mockInventoryRepo.save.mock.calls[0][0];
    expect(savedInventory.productSku).toBe('MILK-TH-180');
    expect(savedInventory.onHand).toBe(0);
    expect(savedInventory.onOrder).toBe(0);
    expect(savedInventory.safetyStock).toBe(15);

    expect(mockAuditLogRepo.create).toHaveBeenCalledWith({
      userId: 'user-admin-1',
      action: 'CREATE_PRODUCT',
      entityName: 'products',
      entityId: 'MILK-TH-180',
      newValues: {
        name: 'Sữa tươi TH True Milk 180ml',
        category: 'Sữa & Bơ sữa',
        unit: 'Hộp',
        costPrice: 7000,
        sellingPrice: 9000,
        defaultLeadTime: 2,
        minSafetyStock: 15,
      },
      ipAddress: '192.168.1.10',
    });
    expect(result).toMatchObject({
      sku: 'MILK-TH-180',
      name: 'Sữa tươi TH True Milk 180ml',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 7000,
      sellingPrice: 9000,
      defaultLeadTime: 2,
      minSafetyStock: 15,
      isActive: true,
    });
  });

  it('should normalize lowercase SKU to uppercase and trim spaces', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);
    mockProductRepo.save.mockImplementation(async (p: Product) => p);

    const dtoWithSpaces = { ...validDto, sku: '  milk-th-180  ' };
    const result = await useCase.execute(dtoWithSpaces);

    expect(mockProductRepo.findBySku).toHaveBeenCalledWith('MILK-TH-180');
    expect(result.sku).toBe('MILK-TH-180');
  });

  it('should throw ValidationException if required fields are missing', async () => {
    const invalidDto = { ...validDto, name: '' };
    await expect(useCase.execute(invalidDto)).rejects.toThrow(ValidationException);
  });

  it('should throw DuplicateResourceException if SKU already exists', async () => {
    const existingProduct = new Product(validDto);
    mockProductRepo.findBySku.mockResolvedValue(existingProduct);

    await expect(useCase.execute(validDto)).rejects.toThrow(DuplicateResourceException);
    expect(mockUnitOfWork.executeInTransaction).not.toHaveBeenCalled();
  });

  it('should catch Prisma P2002 unique constraint violation and throw DuplicateResourceException', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);
    const p2002Error: any = new Error('Unique constraint failed on the fields: (`sku`)');
    p2002Error.code = 'P2002';
    mockUnitOfWork.executeInTransaction.mockRejectedValue(p2002Error);

    await expect(useCase.execute(validDto)).rejects.toThrow(DuplicateResourceException);
  });

  it('should rethrow unknown errors from transaction', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);
    const dbError = new Error('Database connection lost');
    mockUnitOfWork.executeInTransaction.mockRejectedValue(dbError);

    await expect(useCase.execute(validDto)).rejects.toThrow('Database connection lost');
  });
});
