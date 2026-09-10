import { ManageSupplierUseCase } from '../../../src/application/use-cases/supplier/ManageSupplierUseCase';
import { ISupplierRepository } from '../../../src/domain/repositories/ISupplierRepository';
import { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { Supplier } from '../../../src/domain/entities/Supplier';
import { Product } from '../../../src/domain/entities/Product';
import { ProductSupplier } from '../../../src/domain/entities/ProductSupplier';
import { DuplicateResourceException, ValidationException, EntityNotFoundException } from '../../../src/application/exceptions';

describe('ManageSupplierUseCase - createSupplier (UC-002, FR-002)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let useCase: ManageSupplierUseCase;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findProductSupplier: jest.fn(),
      findSuppliersByProductSku: jest.fn(),
      findAllProductSuppliers: jest.fn(),
      findProductSuppliersBySupplierId: jest.fn(),
      saveProductSupplier: jest.fn(),
      updateProductSupplier: jest.fn(),
      deleteProductSupplier: jest.fn(),
    };

    mockAuditLogRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ManageSupplierUseCase(mockSupplierRepo, mockAuditLogRepo);
  });

  it('should successfully create a new supplier and record audit log', async () => {
    mockSupplierRepo.findByCode.mockResolvedValue(null);
    mockSupplierRepo.findByName.mockResolvedValue(null);

    const savedSupplier = new Supplier({
      id: '10',
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      phone: '02854155555',
      email: 'contact@vinamilk.com.vn',
      statusTag: 'NEW_SUPPLIER',
      isActive: true,
      productCount: 0,
    });

    mockSupplierRepo.save.mockResolvedValue(savedSupplier);

    const result = await useCase.createSupplier(
      {
        code: 'SUP-VINAMILK',
        name: 'Công ty Cổ phần Sữa Việt Nam',
        phone: '02854155555',
        email: 'contact@vinamilk.com.vn',
      },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(result.id).toBe(10);
    expect(result.code).toBe('SUP-VINAMILK');
    expect(result.statusTag).toBe('NEW_SUPPLIER');
    expect(result.productCount).toBe(0);
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_SUPPLIER',
        userId: 'admin-uuid-1',
        entityId: 'SUP-VINAMILK',
        ipAddress: '127.0.0.1',
      })
    );
  });

  it('should throw DuplicateResourceException when supplier code already exists', async () => {
    const existing = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk Cũ',
      phone: '02854155555',
    });

    mockSupplierRepo.findByCode.mockResolvedValue(existing);

    await expect(
      useCase.createSupplier({
        code: 'SUP-VINAMILK',
        name: 'Vinamilk Mới',
        phone: '02854155555',
      })
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockSupplierRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DuplicateResourceException when supplier name already exists', async () => {
    mockSupplierRepo.findByCode.mockResolvedValue(null);

    const existingName = new Supplier({
      id: '2',
      code: 'SUP-OTHER',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      phone: '02854155555',
    });

    mockSupplierRepo.findByName.mockResolvedValue(existingName);

    await expect(
      useCase.createSupplier({
        code: 'SUP-VINAMILK-NEW',
        name: 'Công ty Cổ phần Sữa Việt Nam',
        phone: '02854155555',
      })
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockSupplierRepo.save).not.toHaveBeenCalled();
  });

  it('should catch Prisma P2002 error and throw DuplicateResourceException on race condition', async () => {
    mockSupplierRepo.findByCode.mockResolvedValue(null);
    mockSupplierRepo.findByName.mockResolvedValue(null);

    const prismaError = new Error('Unique constraint failed on the fields: (`name`)');
    (prismaError as any).code = 'P2002';
    (prismaError as any).meta = { target: ['name'] };

    mockSupplierRepo.save.mockRejectedValue(prismaError);

    await expect(
      useCase.createSupplier({
        code: 'SUP-NEW',
        name: 'Công ty Trùng Tên',
        phone: '0123456789',
      })
    ).rejects.toThrow(DuplicateResourceException);
  });

  it('should throw ValidationException when required fields are missing', async () => {
    await expect(
      useCase.createSupplier({
        code: '',
        name: 'Thiếu Mã',
        phone: '0123456789',
      })
    ).rejects.toThrow(ValidationException);
  });
});

describe('ManageSupplierUseCase - getSupplierById (UC-002, FR-002)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let useCase: ManageSupplierUseCase;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findProductSupplier: jest.fn(),
      findSuppliersByProductSku: jest.fn(),
      findAllProductSuppliers: jest.fn(),
      findProductSuppliersBySupplierId: jest.fn(),
      saveProductSupplier: jest.fn(),
      updateProductSupplier: jest.fn(),
      deleteProductSupplier: jest.fn(),
    };

    useCase = new ManageSupplierUseCase(mockSupplierRepo);
  });

  it('should successfully return SupplierDetailResponseDTO with products', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      phone: '02854155555',
      email: 'contact@vinamilk.com.vn',
      address: '10 Tân Trào, Q7',
      statusTag: 'ACTIVE',
      isActive: true,
      productCount: 1,
    });

    const mockTerms = [
      new ProductSupplier({
        id: '100',
        productSku: 'MILK-VNM-180',
        productName: 'Sữa tươi Vinamilk 180ml',
        supplierId: '1',
        purchasePrice: 6200,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
      }),
    ];

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockSupplierRepo.findProductSuppliersBySupplierId.mockResolvedValue(mockTerms);

    const result = await useCase.getSupplierById('1');

    expect(mockSupplierRepo.findById).toHaveBeenCalledWith('1');
    expect(mockSupplierRepo.findProductSuppliersBySupplierId).toHaveBeenCalledWith('1');
    expect(result.id).toBe(1);
    expect(result.code).toBe('SUP-VINAMILK');
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual(
      expect.objectContaining({
        id: '100',
        productSku: 'MILK-VNM-180',
        productName: 'Sữa tươi Vinamilk 180ml',
        supplierId: '1',
        purchasePrice: 6200,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
        supplierName: 'Công ty Cổ phần Sữa Việt Nam',
        supplierCode: 'SUP-VINAMILK',
      })
    );
  });

  it('should throw EntityNotFoundException when supplier does not exist', async () => {
    mockSupplierRepo.findById.mockResolvedValue(null);

    await expect(useCase.getSupplierById('999')).rejects.toThrow(EntityNotFoundException);
    expect(mockSupplierRepo.findProductSuppliersBySupplierId).not.toHaveBeenCalled();
  });

  it('should return empty products array when supplier has no product terms', async () => {
    const mockSupplier = new Supplier({
      id: '2',
      code: 'SUP-TH',
      name: 'TH True Milk',
      phone: '0281234567',
      statusTag: 'NEW_SUPPLIER',
      isActive: true,
      productCount: 0,
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockSupplierRepo.findProductSuppliersBySupplierId.mockResolvedValue([]);

    const result = await useCase.getSupplierById('2');

    expect(result.id).toBe(2);
    expect(result.products).toEqual([]);
  });
});

describe('ManageSupplierUseCase - updateSupplier (UC-002, FR-002, BR-021)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let useCase: ManageSupplierUseCase;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findProductSupplier: jest.fn(),
      findSuppliersByProductSku: jest.fn(),
      findAllProductSuppliers: jest.fn(),
      findProductSuppliersBySupplierId: jest.fn(),
      saveProductSupplier: jest.fn(),
      updateProductSupplier: jest.fn(),
      deleteProductSupplier: jest.fn(),
    };

    mockAuditLogRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ManageSupplierUseCase(mockSupplierRepo, mockAuditLogRepo);
  });

  it('should successfully update supplier info and record UPDATE_SUPPLIER audit log', async () => {
    const existing = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk Cũ',
      phone: '02854155555',
      email: 'old@vinamilk.com.vn',
      address: 'Địa chỉ cũ',
      statusTag: 'NEW_SUPPLIER',
      isActive: true,
      productCount: 12,
    });

    mockSupplierRepo.findById.mockResolvedValue(existing);
    mockSupplierRepo.findByName.mockResolvedValue(null);
    mockSupplierRepo.update.mockImplementation(async (s) => s);

    const result = await useCase.updateSupplier(
      '1',
      {
        name: 'Vinamilk Mới',
        phone: '02899999999',
        email: 'new@vinamilk.com.vn',
        statusTag: 'ACTIVE',
      },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(result.name).toBe('Vinamilk Mới');
    expect(result.phone).toBe('02899999999');
    expect(result.email).toBe('new@vinamilk.com.vn');
    expect(result.statusTag).toBe('ACTIVE');
    expect(result.productCount).toBe(12);

    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_SUPPLIER',
        userId: 'admin-uuid-1',
        entityId: 'SUP-VINAMILK',
        ipAddress: '127.0.0.1',
        oldValues: expect.objectContaining({
          name: 'Vinamilk Cũ',
          phone: '02854155555',
        }),
        newValues: expect.objectContaining({
          name: 'Vinamilk Mới',
          phone: '02899999999',
        }),
      })
    );
  });

  it('should deactivate supplier (isActive = false) and record DEACTIVATE_SUPPLIER audit log (BR-021)', async () => {
    const existing = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
      isActive: true,
      productCount: 10,
    });

    mockSupplierRepo.findById.mockResolvedValue(existing);
    mockSupplierRepo.update.mockImplementation(async (s) => s);

    const result = await useCase.updateSupplier(
      '1',
      { isActive: false },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(result.isActive).toBe(false);
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DEACTIVATE_SUPPLIER',
        userId: 'admin-uuid-1',
        entityId: 'SUP-VINAMILK',
      })
    );
  });

  it('should reactivate supplier (isActive = true) and record ACTIVATE_SUPPLIER audit log', async () => {
    const existing = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
      isActive: false,
    });

    mockSupplierRepo.findById.mockResolvedValue(existing);
    mockSupplierRepo.update.mockImplementation(async (s) => s);

    const result = await useCase.updateSupplier(
      '1',
      { isActive: true },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(result.isActive).toBe(true);
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACTIVATE_SUPPLIER',
        userId: 'admin-uuid-1',
        entityId: 'SUP-VINAMILK',
      })
    );
  });

  it('should throw EntityNotFoundException when updating non-existent supplier', async () => {
    mockSupplierRepo.findById.mockResolvedValue(null);

    await expect(useCase.updateSupplier('999', { name: 'Any Name' })).rejects.toThrow(
      EntityNotFoundException
    );
    expect(mockSupplierRepo.update).not.toHaveBeenCalled();
  });

  it('should throw DuplicateResourceException when new name belongs to another supplier (E1)', async () => {
    const currentSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
    });

    const otherSupplier = new Supplier({
      id: '2',
      code: 'SUP-TH',
      name: 'TH True Milk',
      phone: '0281234567',
    });

    mockSupplierRepo.findById.mockResolvedValue(currentSupplier);
    mockSupplierRepo.findByName.mockResolvedValue(otherSupplier);

    await expect(
      useCase.updateSupplier('1', { name: 'TH True Milk' })
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockSupplierRepo.update).not.toHaveBeenCalled();
  });

  it('should allow keeping the same name without throwing DuplicateResourceException', async () => {
    const currentSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
    });

    mockSupplierRepo.findById.mockResolvedValue(currentSupplier);
    mockSupplierRepo.findByName.mockResolvedValue(currentSupplier);
    mockSupplierRepo.update.mockImplementation(async (s) => s);

    const result = await useCase.updateSupplier('1', {
      name: 'Vinamilk',
      phone: '02899999999',
    });

    expect(result.name).toBe('Vinamilk');
    expect(result.phone).toBe('02899999999');
    expect(mockSupplierRepo.update).toHaveBeenCalled();
  });

  it('should catch Prisma P2002 error and throw DuplicateResourceException on race condition', async () => {
    const currentSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
    });

    mockSupplierRepo.findById.mockResolvedValue(currentSupplier);
    mockSupplierRepo.findByName.mockResolvedValue(null);

    const prismaError = new Error('Unique constraint failed on the fields: (`name`)');
    (prismaError as any).code = 'P2002';
    (prismaError as any).meta = { target: ['name'] };

    mockSupplierRepo.update.mockRejectedValue(prismaError);

    await expect(
      useCase.updateSupplier('1', { name: 'Tên Trùng Lặp' })
    ).rejects.toThrow(DuplicateResourceException);
  });
});

describe('ManageSupplierUseCase - setProductSupplierTerms (UC-002, FR-002, BR-012, BR-014)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let useCase: ManageSupplierUseCase;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findProductSupplier: jest.fn(),
      findSuppliersByProductSku: jest.fn(),
      findAllProductSuppliers: jest.fn(),
      findProductSuppliersBySupplierId: jest.fn(),
      saveProductSupplier: jest.fn(),
      updateProductSupplier: jest.fn(),
      deleteProductSupplier: jest.fn(),
    };

    mockAuditLogRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    mockProductRepo = {
      findBySku: jest.fn(),
      findAll: jest.fn(),
      findAllCategories: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      exists: jest.fn(),
      findBySkus: jest.fn(),
    };

    useCase = new ManageSupplierUseCase(mockSupplierRepo, mockAuditLogRepo, mockProductRepo);
  });

  it('should successfully create new product terms with productName and record audit log', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      phone: '02854155555',
    });

    const mockProduct = new Product({
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      category: 'Sữa',
      costPrice: 5000,
      sellingPrice: 7000,
      unit: 'Hộp',
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockProductRepo.findBySku.mockResolvedValue(mockProduct);
    mockSupplierRepo.findProductSupplier.mockResolvedValue(null);

    const savedTerms = new ProductSupplier({
      id: '101',
      productSku: 'MILK-VNM-180',
      productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      supplierId: '1',
      purchasePrice: 6200,
      moq: 24,
      packSize: 12,
      committedLeadTime: 2,
      isPreferred: true,
    });
    mockSupplierRepo.saveProductSupplier.mockResolvedValue(savedTerms);

    const result = await useCase.setProductSupplierTerms(
      {
        productSku: 'MILK-VNM-180',
        supplierId: '1',
        purchasePrice: 6200,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
      },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(mockSupplierRepo.saveProductSupplier).toHaveBeenCalled();
    expect(mockSupplierRepo.updateProductSupplier).not.toHaveBeenCalled();
    expect(result.id).toBe('101');
    expect(result.productSku).toBe('MILK-VNM-180');
    expect(result.productName).toBe('Sữa tươi tiệt trùng Vinamilk 180ml');
    expect(result.supplierName).toBe('Công ty Cổ phần Sữa Việt Nam');
    expect(result.supplierCode).toBe('SUP-VINAMILK');
    expect(result.purchasePrice).toBe(6200);
    expect(result.moq).toBe(24);
    expect(result.packSize).toBe(12);
    expect(result.committedLeadTime).toBe(2);
    expect(result.isPreferred).toBe(true);

    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SET_PRODUCT_SUPPLIER_TERMS',
        userId: 'admin-uuid-1',
        entityId: 'MILK-VNM-180_1',
        oldValues: null,
        newValues: expect.objectContaining({
          purchasePrice: 6200,
          moq: 24,
          packSize: 12,
          committedLeadTime: 2,
          isPreferred: true,
        }),
      })
    );
  });

  it('should successfully update existing product terms and record audit log with oldValues', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      phone: '02854155555',
    });

    const mockProduct = new Product({
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      category: 'Sữa',
      costPrice: 5000,
      sellingPrice: 7000,
      unit: 'Hộp',
    });

    const existingTerms = new ProductSupplier({
      id: '101',
      productSku: 'MILK-VNM-180',
      productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      supplierId: '1',
      purchasePrice: 6000,
      moq: 12,
      packSize: 6,
      committedLeadTime: 3,
      isPreferred: false,
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockProductRepo.findBySku.mockResolvedValue(mockProduct);
    mockSupplierRepo.findProductSupplier.mockResolvedValue(existingTerms);

    const updatedTerms = new ProductSupplier({
      id: '101',
      productSku: 'MILK-VNM-180',
      productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      supplierId: '1',
      purchasePrice: 6500,
      moq: 24,
      packSize: 12,
      committedLeadTime: 2,
      isPreferred: true,
    });
    mockSupplierRepo.updateProductSupplier.mockResolvedValue(updatedTerms);

    const result = await useCase.setProductSupplierTerms(
      {
        productSku: 'MILK-VNM-180',
        supplierId: '1',
        purchasePrice: 6500,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
      },
      'admin-uuid-1',
      '127.0.0.1'
    );

    expect(mockSupplierRepo.updateProductSupplier).toHaveBeenCalled();
    expect(mockSupplierRepo.saveProductSupplier).not.toHaveBeenCalled();
    expect(result.purchasePrice).toBe(6500);

    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SET_PRODUCT_SUPPLIER_TERMS',
        userId: 'admin-uuid-1',
        entityId: 'MILK-VNM-180_1',
        oldValues: expect.objectContaining({
          purchasePrice: 6000,
          moq: 12,
          isPreferred: false,
        }),
        newValues: expect.objectContaining({
          purchasePrice: 6500,
          moq: 24,
          isPreferred: true,
        }),
      })
    );
  });

  it('should throw EntityNotFoundException when supplier does not exist', async () => {
    mockSupplierRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.setProductSupplierTerms({
        productSku: 'MILK-VNM-180',
        supplierId: '999',
        purchasePrice: 6000,
      })
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockProductRepo.findBySku).not.toHaveBeenCalled();
    expect(mockSupplierRepo.saveProductSupplier).not.toHaveBeenCalled();
  });

  it('should throw EntityNotFoundException when product SKU does not exist in productRepository', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockProductRepo.findBySku.mockResolvedValue(null);

    await expect(
      useCase.setProductSupplierTerms({
        productSku: 'UNKNOWN-SKU-999',
        supplierId: '1',
        purchasePrice: 6000,
      })
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockSupplierRepo.saveProductSupplier).not.toHaveBeenCalled();
    expect(mockSupplierRepo.updateProductSupplier).not.toHaveBeenCalled();
  });

  it('should catch Prisma P2003 foreign key error and throw EntityNotFoundException on race condition', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-VINAMILK',
      name: 'Vinamilk',
      phone: '02854155555',
    });

    const mockProduct = new Product({
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi',
      category: 'Sữa',
      costPrice: 5000,
      sellingPrice: 7000,
      unit: 'Hộp',
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockProductRepo.findBySku.mockResolvedValue(mockProduct);
    mockSupplierRepo.findProductSupplier.mockResolvedValue(null);

    const p2003Error = new Error('Foreign key constraint failed on field product_sku');
    (p2003Error as any).code = 'P2003';
    mockSupplierRepo.saveProductSupplier.mockRejectedValue(p2003Error);

    await expect(
      useCase.setProductSupplierTerms({
        productSku: 'MILK-VNM-180',
        supplierId: '1',
        purchasePrice: 6000,
      })
    ).rejects.toThrow(EntityNotFoundException);
  });
});
