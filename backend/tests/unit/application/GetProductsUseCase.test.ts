import { GetProductsUseCase } from '../../../src/application/use-cases/product/GetProductsUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { Product } from '../../../src/domain/entities/Product';

describe('GetProductsUseCase (UC-001 / FR-001)', () => {
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let getProductsUseCase: GetProductsUseCase;

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
    getProductsUseCase = new GetProductsUseCase(mockProductRepo);
  });

  const sampleProduct = new Product({
    sku: 'MILK-VNM-180',
    name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
    category: 'Sữa & Bơ sữa',
    unit: 'Hộp',
    costPrice: 6500,
    sellingPrice: 8500,
    defaultLeadTime: 2,
    minSafetyStock: 10,
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00.000Z'),
    updatedAt: new Date('2026-09-04T09:00:00.000Z'),
  });

  it('should call repository with default pagination and sorting (page=1, limit=20, offset=0, sortBy=sku, sortOrder=asc)', async () => {
    mockProductRepo.findAll.mockResolvedValue({
      products: [sampleProduct],
      total: 1,
    });

    const result = await getProductsUseCase.execute();

    expect(mockProductRepo.findAll).toHaveBeenCalledWith({
      category: undefined,
      isActive: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
      sortBy: 'sku',
      sortOrder: 'asc',
    });

    expect(result.total).toBe(1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual({
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 6500,
      sellingPrice: 8500,
      defaultLeadTime: 2,
      minSafetyStock: 10,
      isActive: true,
      createdAt: sampleProduct.createdAt,
      updatedAt: sampleProduct.updatedAt,
    });
  });

  it('should correctly calculate offset and pass filters with trimmed search and custom sorting', async () => {
    mockProductRepo.findAll.mockResolvedValue({
      products: [],
      total: 0,
    });

    await getProductsUseCase.execute({
      page: 3,
      limit: 15,
      category: '  Sữa & Bơ sữa  ',
      search: '  Vinamilk  ',
      isActive: true,
      sortBy: 'sellingPrice',
      sortOrder: 'desc',
    });

    expect(mockProductRepo.findAll).toHaveBeenCalledWith({
      category: 'Sữa & Bơ sữa',
      isActive: true,
      search: 'Vinamilk',
      limit: 15,
      offset: 30, // (3 - 1) * 15 = 30
      sortBy: 'sellingPrice',
      sortOrder: 'desc',
    });
  });

  it('should support querying inactive products (isActive = false)', async () => {
    mockProductRepo.findAll.mockResolvedValue({
      products: [],
      total: 0,
    });

    await getProductsUseCase.execute({
      isActive: false,
    });

    expect(mockProductRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      })
    );
  });

  it('should clamp limit between 1 and 100 and page to at least 1', async () => {
    mockProductRepo.findAll.mockResolvedValue({
      products: [],
      total: 0,
    });

    await getProductsUseCase.execute({
      page: -5,
      limit: 500, // Exceeds max 100
    });

    expect(mockProductRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
        offset: 0, // (1 - 1) * 100 = 0
      })
    );
  });

  it('should fallback to default sortBy sku if invalid sortBy field is passed', async () => {
    mockProductRepo.findAll.mockResolvedValue({
      products: [],
      total: 0,
    });

    await getProductsUseCase.execute({
      sortBy: 'invalid_field' as any,
    });

    expect(mockProductRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'sku',
        sortOrder: 'asc',
      })
    );
  });

  it('should delegate getCategories to repository findAllCategories', async () => {
    const categories = ['Sữa & Bơ sữa', 'Đồ uống & Giải khát'];
    mockProductRepo.findAllCategories.mockResolvedValue(categories);

    const result = await getProductsUseCase.getCategories();

    expect(mockProductRepo.findAllCategories).toHaveBeenCalled();
    expect(result).toEqual(categories);
  });
});
