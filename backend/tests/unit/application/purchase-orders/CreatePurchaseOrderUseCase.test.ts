import { CreatePurchaseOrderUseCase } from '../../../../src/application/use-cases/purchase-orders/CreatePurchaseOrderUseCase';
import { IPurchaseOrderRepository } from '../../../../src/domain/repositories/IPurchaseOrderRepository';
import { ISupplierRepository } from '../../../../src/domain/repositories/ISupplierRepository';
import { IProductRepository } from '../../../../src/domain/repositories/IProductRepository';
import { IUnitOfWork } from '../../../../src/application/ports/IUnitOfWork';
import { CreatePurchaseOrderDto } from '../../../../src/application/dtos/PurchaseOrderDTO';
import { ApplicationException } from '../../../../src/application/exceptions/ApplicationException';

describe('CreatePurchaseOrderUseCase', () => {
  let useCase: CreatePurchaseOrderUseCase;
  let mockPoRepo: jest.Mocked<IPurchaseOrderRepository>;
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockPoRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      countPOsInDate: jest.fn(),
      search: jest.fn(),
    } as any;

    mockSupplierRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      search: jest.fn(),
    } as any;

    mockProductRepo = {
      findBySku: jest.fn(),
      save: jest.fn(),
      search: jest.fn(),
    } as any;

    mockUow = {
      executeInTransaction: jest.fn().mockImplementation(async (work) => await work())
    } as any;

    useCase = new CreatePurchaseOrderUseCase(mockPoRepo, mockSupplierRepo, mockProductRepo, mockUow);
  });

  it('should create a purchase order successfully', async () => {
    const dto: CreatePurchaseOrderDto = {
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'admin',
      items: [
        { productSku: 'SKU-1', orderedQuantity: 10, unitPrice: 100 }
      ]
    };

    mockSupplierRepo.findById.mockResolvedValue({ isActive: true } as any);
    mockProductRepo.findBySku.mockResolvedValue({} as any);
    mockPoRepo.countPOsInDate.mockResolvedValue(0);

    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.status).toBe('DRAFT');
    expect(result.totalAmount).toBe(1000);
    expect(mockPoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if supplier not found', async () => {
    const dto: CreatePurchaseOrderDto = {
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'admin',
      items: [
        { productSku: 'SKU-1', orderedQuantity: 10, unitPrice: 100 }
      ]
    };

    mockSupplierRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(dto)).rejects.toThrow(ApplicationException);
  });
});
