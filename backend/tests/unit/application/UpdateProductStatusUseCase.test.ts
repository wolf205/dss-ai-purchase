import { UpdateProductStatusUseCase } from '../../../src/application/use-cases/product/UpdateProductStatusUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository';
import { Product } from '../../../src/domain/entities/Product';
import { EntityNotFoundException } from '../../../src/application/exceptions';

describe('UpdateProductStatusUseCase (UC-001 / BR-021)', () => {
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let useCase: UpdateProductStatusUseCase;

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
    mockAuditLogRepo = {
      create: jest.fn(),
    };
    useCase = new UpdateProductStatusUseCase(mockProductRepo, mockAuditLogRepo);
  });

  const createActiveProduct = () =>
    new Product({
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 6500,
      sellingPrice: 8500,
      defaultLeadTime: 2,
      minSafetyStock: 10,
      isActive: true,
    });

  it('should deactivate product successfully and record audit log', async () => {
    const product = createActiveProduct();
    mockProductRepo.findBySku.mockResolvedValue(product);
    mockProductRepo.update.mockResolvedValue(product);

    const result = await useCase.execute('MILK-VNM-180', false, 'admin-123', '127.0.0.1');

    expect(mockProductRepo.findBySku).toHaveBeenCalledWith('MILK-VNM-180');
    expect(product.isActive).toBe(false);
    expect(mockProductRepo.update).toHaveBeenCalledWith(product);
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith({
      userId: 'admin-123',
      action: 'DEACTIVATE_PRODUCT',
      entityName: 'products',
      entityId: 'MILK-VNM-180',
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({
      sku: 'MILK-VNM-180',
      isActive: false,
      message: 'Đã vô hiệu hóa sản phẩm. Sản phẩm sẽ bị loại trừ khỏi dự báo AI và khuyến nghị mua hàng.',
    });
  });

  it('should activate product successfully and record audit log', async () => {
    const product = createActiveProduct();
    product.setActiveStatus(false);
    mockProductRepo.findBySku.mockResolvedValue(product);
    mockProductRepo.update.mockResolvedValue(product);

    const result = await useCase.execute('MILK-VNM-180', true, 'admin-123', '127.0.0.1');

    expect(product.isActive).toBe(true);
    expect(mockProductRepo.update).toHaveBeenCalledWith(product);
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith({
      userId: 'admin-123',
      action: 'ACTIVATE_PRODUCT',
      entityName: 'products',
      entityId: 'MILK-VNM-180',
      oldValues: { isActive: false },
      newValues: { isActive: true },
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({
      sku: 'MILK-VNM-180',
      isActive: true,
      message: 'Đã kích hoạt lại sản phẩm thành công.',
    });
  });

  it('should be idempotent and not call update or audit log if status is unchanged', async () => {
    const product = createActiveProduct();
    mockProductRepo.findBySku.mockResolvedValue(product);

    const result = await useCase.execute('MILK-VNM-180', true, 'admin-123', '127.0.0.1');

    expect(mockProductRepo.update).not.toHaveBeenCalled();
    expect(mockAuditLogRepo.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      sku: 'MILK-VNM-180',
      isActive: true,
      message: 'Sản phẩm đã ở trạng thái đang kinh doanh.',
    });
  });

  it('should throw EntityNotFoundException if SKU does not exist', async () => {
    mockProductRepo.findBySku.mockResolvedValue(null);

    await expect(
      useCase.execute('NON-EXISTENT', false, 'admin-123')
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockProductRepo.update).not.toHaveBeenCalled();
  });
});
