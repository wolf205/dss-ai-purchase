import { Request, Response } from 'express';
import { ManageSupplierUseCase } from '../../application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../application/use-cases/supplier/GetSupplierWeightsUseCase';
import { GetSupplierEvaluationsUseCase } from '../../application/use-cases/supplier/GetSupplierEvaluationsUseCase';
import { GetSupplierDeliveriesUseCase } from '../../application/use-cases/supplier/GetSupplierDeliveriesUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class SupplierController {
  constructor(
    private readonly manageSupplierUseCase: ManageSupplierUseCase,
    private readonly updateSupplierWeightsUseCase: UpdateSupplierWeightsUseCase,
    private readonly getSupplierWeightsUseCase: GetSupplierWeightsUseCase,
    private readonly getSupplierEvaluationsUseCase: GetSupplierEvaluationsUseCase,
    private readonly getSupplierDeliveriesUseCase?: GetSupplierDeliveriesUseCase
  ) {}

  public getEvaluations = async (_req: Request, res: Response): Promise<void> => {
    const evaluations = await this.getSupplierEvaluationsUseCase.execute();
    res.status(200).json({
      success: true,
      data: evaluations,
      timestamp: new Date().toISOString(),
    });
  };

  public getSupplierDeliveries = async (req: Request, res: Response): Promise<void> => {
    const supplierId = req.params.id;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (!this.getSupplierDeliveriesUseCase) {
      res.status(500).json({ success: false, message: 'GetSupplierDeliveriesUseCase not injected' });
      return;
    }
    const deliveries = await this.getSupplierDeliveriesUseCase.execute(supplierId, limit);
    res.status(200).json({
      success: true,
      data: deliveries,
      timestamp: new Date().toISOString(),
    });
  };

  public listSuppliers = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as {
      page?: number;
      limit?: number;
      statusTag?: string;
      isActive?: boolean;
      search?: string;
      sortBy?: 'code' | 'name' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.manageSupplierUseCase.getSuppliers({
      page,
      limit,
      statusTag: query.statusTag,
      isActive: query.isActive,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    res.status(200).json({
      success: true,
      data: result.suppliers,
      meta: buildPaginationMeta(page, limit, result.total),
      timestamp: new Date().toISOString(),
    });
  };

  public getSupplierById = async (req: Request, res: Response): Promise<void> => {
    const supplier = await this.manageSupplierUseCase.getSupplierById(req.params.id);
    res.status(200).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public createSupplier = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const supplier = await this.manageSupplierUseCase.createSupplier(req.body, operatorUserId, ipAddress);
    res.status(201).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public updateSupplier = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const supplier = await this.manageSupplierUseCase.updateSupplier(req.params.id, req.body, operatorUserId, ipAddress);
    res.status(200).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString(),
    });
  };

  public setProductSupplierTerms = async (req: Request, res: Response): Promise<void> => {
    const supplierId = req.params.id || req.body.supplierId;
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const terms = await this.manageSupplierUseCase.setProductSupplierTerms(
      {
        ...req.body,
        supplierId,
      },
      operatorUserId,
      ipAddress
    );
    res.status(201).json({
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
