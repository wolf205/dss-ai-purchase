import { SupplierController } from '../../../src/api/controllers/SupplierController';
import { ManageSupplierUseCase } from '../../../src/application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../../src/application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../../src/application/use-cases/supplier/GetSupplierWeightsUseCase';
import { GetSupplierEvaluationsUseCase } from '../../../src/application/use-cases/supplier/GetSupplierEvaluationsUseCase';
import { Request, Response } from 'express';

describe('SupplierController - Routing & Evaluation (UC-009)', () => {
  let mockManageSupplierUseCase: jest.Mocked<ManageSupplierUseCase>;
  let mockUpdateWeightsUseCase: jest.Mocked<UpdateSupplierWeightsUseCase>;
  let mockGetWeightsUseCase: jest.Mocked<GetSupplierWeightsUseCase>;
  let mockGetEvaluationsUseCase: jest.Mocked<GetSupplierEvaluationsUseCase>;
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

    controller = new SupplierController(
      mockManageSupplierUseCase,
      mockUpdateWeightsUseCase,
      mockGetWeightsUseCase,
      mockGetEvaluationsUseCase
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

  it('getSupplierById should return 400 when id is non-numeric (preventing BigInt crash)', async () => {
    req = { params: { id: 'evaluations' } };
    await controller.getSupplierById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
    expect(mockManageSupplierUseCase.getSupplierById).not.toHaveBeenCalled();
  });

  it('getSupplierById should call useCase and return 200 when id is numeric', async () => {
    req = { params: { id: '1' } };
    mockManageSupplierUseCase.getSupplierById.mockResolvedValue({
      id: '1',
      code: 'SUP-001',
      name: 'Vinamilk',
    } as any);

    await controller.getSupplierById(req as Request, res as Response);

    expect(mockManageSupplierUseCase.getSupplierById).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
