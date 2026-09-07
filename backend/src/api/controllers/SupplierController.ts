import { Request, Response } from 'express';
import { ManageSupplierUseCase } from '../../application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../application/use-cases/supplier/GetSupplierWeightsUseCase';
import { GetSupplierEvaluationsUseCase } from '../../application/use-cases/supplier/GetSupplierEvaluationsUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class SupplierController {
  constructor(
    private readonly manageSupplierUseCase: ManageSupplierUseCase,
    private readonly updateSupplierWeightsUseCase: UpdateSupplierWeightsUseCase,
    private readonly getSupplierWeightsUseCase: GetSupplierWeightsUseCase,
    private readonly getSupplierEvaluationsUseCase: GetSupplierEvaluationsUseCase
  ) {}

  public getEvaluations = async (_req: Request, res: Response): Promise<void> => {
    const evaluations = await this.getSupplierEvaluationsUseCase.execute();
    res.status(200).json({
      success: true,
      data: evaluations,
      timestamp: new Date().toISOString(),
    });
  };

  public listSuppliers = async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const statusTag = req.query.statusTag as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const search = req.query.search as string | undefined;

    const result = await this.manageSupplierUseCase.getSuppliers({
      page,
      limit,
      statusTag,
      isActive,
      search,
    });

    res.status(200).json({
      success: true,
      data: result.suppliers,
      meta: buildPaginationMeta(page, limit, result.total),
      timestamp: new Date().toISOString(),
    });
  };

  public getSupplierById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Mã định danh nhà cung cấp không hợp lệ: ${id}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const supplier = await this.manageSupplierUseCase.getSupplierById(id);
    res.status(200).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public createSupplier = async (req: Request, res: Response): Promise<void> => {
    const supplier = await this.manageSupplierUseCase.createSupplier(req.body);
    res.status(201).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public updateSupplier = async (req: Request, res: Response): Promise<void> => {
    const supplier = await this.manageSupplierUseCase.updateSupplier(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public setProductSupplierTerms = async (req: Request, res: Response): Promise<void> => {
    const supplierId = req.params.id || req.body.supplierId;
    const terms = await this.manageSupplierUseCase.setProductSupplierTerms({
      ...req.body,
      supplierId,
    });
    res.status(200).json({
      success: true,
      data: terms,
      timestamp: new Date().toISOString(),
    });
  };

  public getSuppliersByProductSku = async (req: Request, res: Response): Promise<void> => {
    const termsList = await this.manageSupplierUseCase.getSuppliersByProductSku(req.params.sku);
    res.status(200).json({
      success: true,
      data: termsList,
      timestamp: new Date().toISOString(),
    });
  };

  public getEvaluationWeights = async (_req: Request, res: Response): Promise<void> => {
    const weights = await this.getSupplierWeightsUseCase.execute();
    res.status(200).json({
      success: true,
      data: weights,
      timestamp: new Date().toISOString(),
    });
  };

  public updateEvaluationWeights = async (req: Request, res: Response): Promise<void> => {
    const updatedBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    const weights = await this.updateSupplierWeightsUseCase.execute(req.body, updatedBy);
    res.status(200).json({
      success: true,
      data: weights,
      timestamp: new Date().toISOString(),
    });
  };
}
