import { SupplierController } from '../../../src/api/controllers/SupplierController';
import { ManageSupplierUseCase } from '../../../src/application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../../src/application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../../src/application/use-cases/supplier/GetSupplierWeightsUseCase';
import { GetSupplierEvaluationsUseCase } from '../../../src/application/use-cases/supplier/GetSupplierEvaluationsUseCase';
import { GetSupplierDeliveriesUseCase } from '../../../src/application/use-cases/supplier/GetSupplierDeliveriesUseCase';
import {
  supplierIdParamSchema,
  updateSupplierSchema,
  productSupplierTermsSchema,
  supplierDeliveriesQuerySchema,
} from '../../../src/api/validations/supplierValidations';
import { Request, Response } from 'express';

describe('SupplierController - Routing & Evaluation (UC-009)', () => {
  let mockManageSupplierUseCase: jest.Mocked<ManageSupplierUseCase>;
  let mockUpdateWeightsUseCase: jest.Mocked<UpdateSupplierWeightsUseCase>;
  let mockGetWeightsUseCase: jest.Mocked<GetSupplierWeightsUseCase>;
  let mockGetEvaluationsUseCase: jest.Mocked<GetSupplierEvaluationsUseCase>;
  let mockGetSupplierDeliveriesUseCase: jest.Mocked<GetSupplierDeliveriesUseCase>;
  let controller: SupplierController;

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockManageSupplierUseCase = {
      getSuppliers: jest.fn(),
      getSupplierById: jest.fn(),
      createSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      setProductSupplierTerms: jest.fn(),
      getSuppliersByProductSku: jest.fn(),
    } as any;

    mockUpdateWeightsUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetWeightsUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetEvaluationsUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetSupplierDeliveriesUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new SupplierController(
      mockManageSupplierUseCase,
      mockUpdateWeightsUseCase,
      mockGetWeightsUseCase,
      mockGetEvaluationsUseCase,
      mockGetSupplierDeliveriesUseCase
    );

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('getEvaluations should return 200 with evaluations data', async () => {
    const mockData = [
      {
        supplierId: 1,
        supplierCode: 'SUP-001',
        supplierName: 'Vinamilk',
        deliveryCountAnalyzed: 10,
        totalScore: 92.5,
        rank: 1,
        isNewSupplier: false,
        scores: {
          priceScore: 95.0,
          otifScore: 90.0,
          qualityScore: 98.5,
          leadTimeScore: 85.0,
        },
      },
    ];

    mockGetEvaluationsUseCase.execute.mockResolvedValue(mockData as any);

    req = {};
    await controller.getEvaluations(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockData,
      })
    );
  });

  describe('getSupplierById (UC-002, FR-002)', () => {
    it('should validate supplierIdParamSchema correctly', () => {
      // Valid positive integer IDs
      expect(supplierIdParamSchema.safeParse({ id: '1' }).success).toBe(true);
      expect(supplierIdParamSchema.safeParse({ id: '123' }).success).toBe(true);

      // Invalid IDs (non-numeric, zero, negative, empty, decimal)
      expect(supplierIdParamSchema.safeParse({ id: 'evaluations' }).success).toBe(false);
      expect(supplierIdParamSchema.safeParse({ id: '0' }).success).toBe(false);
      expect(supplierIdParamSchema.safeParse({ id: '-5' }).success).toBe(false);
      expect(supplierIdParamSchema.safeParse({ id: '' }).success).toBe(false);
      expect(supplierIdParamSchema.safeParse({ id: '12.5' }).success).toBe(false);
    });

    it('should delegate to useCase and return 200 with supplier detail and products', async () => {
      req = { params: { id: '1' } };
      const mockDetail = {
        id: 1,
        code: 'SUP-001',
        name: 'Vinamilk',
        phone: '02854155555',
        statusTag: 'ACTIVE',
        isActive: true,
        productCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [
          {
            id: '10',
            productSku: 'MILK-VNM-180',
            productName: 'Sữa tươi Vinamilk 180ml',
            supplierId: '1',
            purchasePrice: 6200,
            moq: 24,
            packSize: 12,
            committedLeadTime: 2,
            isPreferred: true,
          },
        ],
      };
      mockManageSupplierUseCase.getSupplierById.mockResolvedValue(mockDetail as any);

      await controller.getSupplierById(req as Request, res as Response);

      expect(mockManageSupplierUseCase.getSupplierById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDetail,
        })
      );
    });
  });

  describe('listSuppliers (UC-002, FR-002)', () => {
    it('should return 200 with suppliers list, productCount, and pagination meta', async () => {
      const mockSuppliers = [
        {
          id: 1,
          code: 'SUP-VINAMILK',
          name: 'Công ty Cổ phần Sữa Việt Nam',
          phone: '02854155555',
          email: 'contact@vinamilk.com.vn',
          statusTag: 'ACTIVE',
          isActive: true,
          productCount: 24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockManageSupplierUseCase.getSuppliers.mockResolvedValue({
        suppliers: mockSuppliers as any,
        total: 1,
      });

      req = {
        query: {
          page: 1 as any,
          limit: 20 as any,
        },
      };

      await controller.listSuppliers(req as Request, res as Response);

      expect(mockManageSupplierUseCase.getSuppliers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        statusTag: undefined,
        isActive: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockSuppliers,
          meta: expect.objectContaining({
            page: 1,
            limit: 20,
            totalItems: 1,
            totalPages: 1,
          }),
        })
      );
    });

    it('should pass isActive: true correctly when filtering active suppliers', async () => {
      mockManageSupplierUseCase.getSuppliers.mockResolvedValue({
        suppliers: [],
        total: 0,
      });

      req = {
        query: {
          isActive: true as any,
          page: 1 as any,
          limit: 10 as any,
        },
      };

      await controller.listSuppliers(req as Request, res as Response);

      expect(mockManageSupplierUseCase.getSuppliers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          page: 1,
          limit: 10,
        })
      );
    });

    it('should pass isActive: false correctly when filtering inactive suppliers', async () => {
      mockManageSupplierUseCase.getSuppliers.mockResolvedValue({
        suppliers: [],
        total: 0,
      });

      req = {
        query: {
          isActive: false as any,
        },
      };

      await controller.listSuppliers(req as Request, res as Response);

      expect(mockManageSupplierUseCase.getSuppliers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should pass search, statusTag, sortBy, and sortOrder correctly', async () => {
      mockManageSupplierUseCase.getSuppliers.mockResolvedValue({
        suppliers: [],
        total: 0,
      });

      req = {
        query: {
          search: 'Vinamilk',
          statusTag: 'ACTIVE',
          sortBy: 'name' as any,
          sortOrder: 'desc' as any,
        },
      };

      await controller.listSuppliers(req as Request, res as Response);

      expect(mockManageSupplierUseCase.getSuppliers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'Vinamilk',
        statusTag: 'ACTIVE',
        isActive: undefined,
        sortBy: 'name',
        sortOrder: 'desc',
      });
    });
  });

  describe('createSupplier (UC-002, FR-002)', () => {
    it('should return 201 with created supplier and forward operator info', async () => {
      const createdSupplier = {
        id: 2,
        code: 'SUP-TH-TRUE',
        name: 'Công ty Cổ phần Thực phẩm Sữa TH',
        phone: '1800545440',
        email: 'contact@thmilk.vn',
        address: 'Nghệ An',
        statusTag: 'NEW_SUPPLIER',
        isActive: true,
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockManageSupplierUseCase.createSupplier.mockResolvedValue(createdSupplier as any);

      req = {
        body: {
          code: 'SUP-TH-TRUE',
          name: 'Công ty Cổ phần Thực phẩm Sữa TH',
          phone: '1800545440',
          email: 'contact@thmilk.vn',
        },
        user: { userId: 'user-admin-1', role: 'ADMIN' } as any,
        ip: '127.0.0.1',
        headers: {},
      };

      await controller.createSupplier(req as Request, res as Response);

      expect(mockManageSupplierUseCase.createSupplier).toHaveBeenCalledWith(
        req.body,
        'user-admin-1',
        '127.0.0.1'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: createdSupplier,
        })
      );
    });
  });

  describe('updateSupplier (UC-002, FR-002)', () => {
    it('should validate updateSupplierSchema correctly', () => {
      // Valid partial payload
      const validPayload = {
        name: 'Công ty Cổ phần Vinamilk',
        phone: '02854155555',
        email: 'contact@vinamilk.com.vn',
        statusTag: 'ACTIVE',
        isActive: false,
      };
      const parseResult = updateSupplierSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);

      // Empty string email and address should transform to null
      const emptyEmailPayload = {
        email: '',
        address: '',
      };
      const transformed = updateSupplierSchema.parse(emptyEmailPayload);
      expect(transformed.email).toBeNull();
      expect(transformed.address).toBeNull();

      // Invalid: empty name
      expect(updateSupplierSchema.safeParse({ name: '' }).success).toBe(false);

      // Invalid: phone too short
      expect(updateSupplierSchema.safeParse({ phone: '123' }).success).toBe(false);

      // Invalid: invalid statusTag
      expect(updateSupplierSchema.safeParse({ statusTag: 'UNKNOWN_TAG' }).success).toBe(false);
    });

    it('should return 200 with updated supplier and forward operator info to useCase', async () => {
      const updatedSupplier = {
        id: 1,
        code: 'SUP-VINAMILK',
        name: 'Vinamilk Mới',
        phone: '02899999999',
        email: 'contact@vinamilk.com.vn',
        address: 'Quận 7, TP.HCM',
        statusTag: 'ACTIVE',
        isActive: true,
        productCount: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockManageSupplierUseCase.updateSupplier.mockResolvedValue(updatedSupplier as any);

      req = {
        params: { id: '1' },
        body: {
          name: 'Vinamilk Mới',
          phone: '02899999999',
        },
        user: { userId: 'admin-uuid-1', role: 'ADMIN' } as any,
        ip: '127.0.0.1',
        headers: {},
      };

      await controller.updateSupplier(req as Request, res as Response);

      expect(mockManageSupplierUseCase.updateSupplier).toHaveBeenCalledWith(
        '1',
        req.body,
        'admin-uuid-1',
        '127.0.0.1'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedSupplier,
        })
      );
    });
  });

  describe('setProductSupplierTerms (UC-002, FR-002)', () => {
    it('should validate productSupplierTermsSchema correctly', () => {
      // Valid payload with all fields
      const validPayload = {
        productSku: 'MILK-VNM-180',
        purchasePrice: 6200,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
      };
      const result = productSupplierTermsSchema.safeParse(validPayload);
      expect(result.success).toBe(true);

      // Valid payload with defaults
      const defaultPayload = {
        productSku: 'MILK-VNM-180',
        purchasePrice: 6200,
      };
      const parsed = productSupplierTermsSchema.parse(defaultPayload);
      expect(parsed.moq).toBe(1);
      expect(parsed.packSize).toBe(1);
      expect(parsed.committedLeadTime).toBe(1);
      expect(parsed.isPreferred).toBe(false);

      // Invalid: purchasePrice <= 0
      expect(productSupplierTermsSchema.safeParse({ productSku: 'MILK', purchasePrice: 0 }).success).toBe(false);
      expect(productSupplierTermsSchema.safeParse({ productSku: 'MILK', purchasePrice: -100 }).success).toBe(false);

      // Invalid: moq < 1
      expect(productSupplierTermsSchema.safeParse({ productSku: 'MILK', purchasePrice: 100, moq: 0 }).success).toBe(false);

      // Invalid: packSize < 1
      expect(productSupplierTermsSchema.safeParse({ productSku: 'MILK', purchasePrice: 100, packSize: 0 }).success).toBe(false);

      // Invalid: committedLeadTime < 1
      expect(productSupplierTermsSchema.safeParse({ productSku: 'MILK', purchasePrice: 100, committedLeadTime: 0 }).success).toBe(false);

      // Invalid: missing productSku
      expect(productSupplierTermsSchema.safeParse({ purchasePrice: 100 }).success).toBe(false);
      expect(productSupplierTermsSchema.safeParse({ productSku: '', purchasePrice: 100 }).success).toBe(false);
    });

    it('should return 201 Created with created/updated terms and forward operator info', async () => {
      const mockTerms = {
        id: '101',
        productSku: 'MILK-VNM-180',
        productName: 'Sữa tươi Vinamilk 180ml',
        supplierId: '1',
        purchasePrice: 6200,
        moq: 24,
        packSize: 12,
        committedLeadTime: 2,
        isPreferred: true,
        supplierName: 'Vinamilk',
        supplierCode: 'SUP-VINAMILK',
      };

      mockManageSupplierUseCase.setProductSupplierTerms.mockResolvedValue(mockTerms as any);

      req = {
        params: { id: '1' },
        body: {
          productSku: 'MILK-VNM-180',
          purchasePrice: 6200,
          moq: 24,
          packSize: 12,
          committedLeadTime: 2,
          isPreferred: true,
        },
        user: { userId: 'admin-uuid-1', role: 'ADMIN' } as any,
        ip: '127.0.0.1',
        headers: {},
      };

      await controller.setProductSupplierTerms(req as Request, res as Response);

      expect(mockManageSupplierUseCase.setProductSupplierTerms).toHaveBeenCalledWith(
        {
          ...req.body,
          supplierId: '1',
        },
        'admin-uuid-1',
        '127.0.0.1'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTerms,
        })
      );
    });
  });

  describe('getSupplierDeliveries (UC-009, FR-020, BR-012)', () => {
    it('should validate supplierDeliveriesQuerySchema correctly', () => {
      // Valid default empty query
      const defaultParsed = supplierDeliveriesQuerySchema.parse({});
      expect(defaultParsed.limit).toBe(10);

      // Valid explicit limits
      expect(supplierDeliveriesQuerySchema.parse({ limit: '5' }).limit).toBe(5);
      expect(supplierDeliveriesQuerySchema.parse({ limit: 50 as any }).limit).toBe(50);
      expect(supplierDeliveriesQuerySchema.parse({ limit: '100' }).limit).toBe(100);

      // Invalid limits: 0, negative, > 100, float, NaN
      expect(supplierDeliveriesQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
      expect(supplierDeliveriesQuerySchema.safeParse({ limit: '-1' }).success).toBe(false);
      expect(supplierDeliveriesQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
      expect(supplierDeliveriesQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
      expect(supplierDeliveriesQuerySchema.safeParse({ limit: '5.5' }).success).toBe(false);
    });

    it('should delegate to useCase with default limit 10 when query.limit is missing', async () => {
      req = {
        params: { id: '1' },
        query: {},
      };

      const mockDeliveries = [
        {
          id: 1,
          orderId: 10,
          poCode: 'PO-20260904-0001',
          supplierId: 1,
          promisedDeliveryDate: '2026-09-06T00:00:00.000Z',
          actualDeliveryDate: '2026-09-06T00:00:00.000Z',
          promisedLeadTimeDays: 2,
          actualLeadTimeDays: 2,
          deliveredQuantity: 100,
          acceptedQuantity: 98,
          isOtif: true,
          createdAt: '2026-09-06T10:00:00.000Z',
        },
      ];

      mockGetSupplierDeliveriesUseCase.execute.mockResolvedValue(mockDeliveries as any);

      await controller.getSupplierDeliveries(req as Request, res as Response);

      expect(mockGetSupplierDeliveriesUseCase.execute).toHaveBeenCalledWith('1', 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDeliveries,
        })
      );
    });

    it('should delegate to useCase with parsed integer limit when query.limit is provided', async () => {
      req = {
        params: { id: '5' },
        query: { limit: 25 as any },
      };

      mockGetSupplierDeliveriesUseCase.execute.mockResolvedValue([]);

      await controller.getSupplierDeliveries(req as Request, res as Response);

      expect(mockGetSupplierDeliveriesUseCase.execute).toHaveBeenCalledWith('5', 25);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
        })
      );
    });
  });
});



