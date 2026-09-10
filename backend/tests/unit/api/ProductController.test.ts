import { ProductController } from '../../../src/api/controllers/ProductController';
import { CreateProductUseCase } from '../../../src/application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../../src/application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../../src/application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../../src/application/use-cases/product/GetProductDetailUseCase';
import { UpdateProductStatusUseCase } from '../../../src/application/use-cases/product/UpdateProductStatusUseCase';
import { Request, Response } from 'express';

describe('ProductController - listProducts (UC-001 / FR-001)', () => {
  let mockCreateProductUseCase: jest.Mocked<CreateProductUseCase>;
  let mockUpdateProductUseCase: jest.Mocked<UpdateProductUseCase>;
  let mockGetProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let mockGetProductDetailUseCase: jest.Mocked<GetProductDetailUseCase>;
  let mockUpdateProductStatusUseCase: jest.Mocked<UpdateProductStatusUseCase>;
  let controller: ProductController;

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockCreateProductUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateProductUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetProductsUseCase = {
      execute: jest.fn(),
      getCategories: jest.fn(),
    } as any;

    mockGetProductDetailUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateProductStatusUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new ProductController(
      mockCreateProductUseCase,
      mockUpdateProductUseCase,
      mockGetProductsUseCase,
      mockGetProductDetailUseCase,
      undefined,
      mockUpdateProductStatusUseCase
    );

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should pass validated query parameters correctly to GetProductsUseCase and return 200 with meta', async () => {
    const mockProducts = [
      {
        sku: 'MILK-VNM-180',
        name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
        category: 'Sữa & Bơ sữa',
        unit: 'Hộp',
        costPrice: 6500,
        sellingPrice: 8500,
        defaultLeadTime: 2,
        minSafetyStock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetProductsUseCase.execute.mockResolvedValue({
      products: mockProducts,
      total: 1,
    });

    req = {
      query: {
        page: 1 as any,
        limit: 20 as any,
        category: 'Sữa & Bơ sữa',
        isActive: true as any,
        search: 'Vinamilk',
        sortBy: 'sku',
        sortOrder: 'asc',
      },
    };

    await controller.listProducts(req as Request, res as Response);

    expect(mockGetProductsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      category: 'Sữa & Bơ sữa',
      isActive: true,
      search: 'Vinamilk',
      sortBy: 'sku',
      sortOrder: 'asc',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockProducts,
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalItems: 1,
        totalPages: 1,
      },
      timestamp: expect.any(String),
    });
  });

  it('should support querying inactive products without converting boolean to false', async () => {
    mockGetProductsUseCase.execute.mockResolvedValue({
      products: [],
      total: 0,
    });

    req = {
      query: {
        isActive: false as any,
      },
    };

    await controller.listProducts(req as Request, res as Response);

    expect(mockGetProductsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      })
    );
  });

  it('should call getCategories and return 200 with category list', async () => {
    const categories = ['Sữa & Bơ sữa', 'Đồ uống & Giải khát'];
    mockGetProductsUseCase.getCategories.mockResolvedValue(categories);

    req = {};

    await controller.getCategories(req as Request, res as Response);

    expect(mockGetProductsUseCase.getCategories).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: categories,
      timestamp: expect.any(String),
    });
  });

  it('updateProductStatus should return 200 with result when successful', async () => {
    const mockResult = {
      sku: 'MILK-VNM-180',
      isActive: false,
      message: 'Đã vô hiệu hóa sản phẩm. Sản phẩm sẽ bị loại trừ khỏi dự báo AI và khuyến nghị mua hàng.',
    };

    mockUpdateProductStatusUseCase.execute.mockResolvedValue(mockResult);

    req = {
      params: { sku: 'MILK-VNM-180' },
      body: { isActive: false },
      user: { userId: 'admin-123' } as any,
      ip: '127.0.0.1',
      headers: {},
    };

    await controller.updateProductStatus(req as Request, res as Response);

    expect(mockUpdateProductStatusUseCase.execute).toHaveBeenCalledWith(
      'MILK-VNM-180',
      false,
      'admin-123',
      '127.0.0.1'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResult,
      timestamp: expect.any(String),
    });
  });

  it('createProduct should return 201 with created product data and pass audit info', async () => {
    const mockCreatedProduct = {
      sku: 'MILK-TH-180',
      name: 'Sữa tươi TH True Milk 180ml',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 7000,
      sellingPrice: 9000,
      defaultLeadTime: 2,
      minSafetyStock: 15,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCreateProductUseCase.execute.mockResolvedValue(mockCreatedProduct);

    req = {
      body: {
        sku: 'MILK-TH-180',
        name: 'Sữa tươi TH True Milk 180ml',
        category: 'Sữa & Bơ sữa',
        unit: 'Hộp',
        costPrice: 7000,
        sellingPrice: 9000,
        defaultLeadTime: 2,
        minSafetyStock: 15,
      },
      user: { userId: 'admin-123' } as any,
      ip: '127.0.0.1',
      headers: {},
    };

    await controller.createProduct(req as Request, res as Response);

    expect(mockCreateProductUseCase.execute).toHaveBeenCalledWith(
      req.body,
      'admin-123',
      '127.0.0.1'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockCreatedProduct,
      timestamp: expect.any(String),
    });
  });

  it('updateProductStatus should return 501 when use case is not injected', async () => {
    const incompleteController = new ProductController(
      mockCreateProductUseCase,
      mockUpdateProductUseCase,
      mockGetProductsUseCase,
      mockGetProductDetailUseCase
    );

    req = {
      params: { sku: 'MILK-VNM-180' },
      body: { isActive: false },
    };

    await incompleteController.updateProductStatus(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Not implemented' },
    });
  });
});
