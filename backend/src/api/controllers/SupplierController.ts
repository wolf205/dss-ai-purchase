import { Request, Response, NextFunction } from 'express';
import { ManageSupplierUseCase } from '../../application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../application/use-cases/supplier/GetSupplierWeightsUseCase';
import { PrismaSupplierRepository } from '../../infrastructure/repositories/PrismaSupplierRepository';
import { PrismaSupplierWeightConfigRepository } from '../../infrastructure/repositories/PrismaSupplierWeightConfigRepository';

const supplierRepository = new PrismaSupplierRepository();
const weightConfigRepository = new PrismaSupplierWeightConfigRepository();

const manageSupplierUseCase = new ManageSupplierUseCase(supplierRepository);
const updateSupplierWeightsUseCase = new UpdateSupplierWeightsUseCase(weightConfigRepository);
const getSupplierWeightsUseCase = new GetSupplierWeightsUseCase(weightConfigRepository);

export class SupplierController {
  public static async listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const statusTag = req.query.statusTag as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const search = req.query.search as string | undefined;

      const result = await manageSupplierUseCase.getSuppliers({
        page,
        limit,
        statusTag,
        isActive,
        search,
      });

      res.status(200).json({
        success: true,
        data: result.suppliers,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await manageSupplierUseCase.getSupplierById(req.params.id);
      res.status(200).json({
        success: true,
        data: supplier,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await manageSupplierUseCase.createSupplier(req.body);
      res.status(201).json({
        success: true,
        data: supplier,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await manageSupplierUseCase.updateSupplier(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: supplier,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async setProductSupplierTerms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const terms = await manageSupplierUseCase.setProductSupplierTerms(req.body);
      res.status(200).json({
        success: true,
        data: terms,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSuppliersByProductSku(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const termsList = await manageSupplierUseCase.getSuppliersByProductSku(req.params.sku);
      res.status(200).json({
        success: true,
        data: termsList,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getEvaluationWeights(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const weights = await getSupplierWeightsUseCase.execute();
      res.status(200).json({
        success: true,
        data: weights,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateEvaluationWeights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
      const weights = await updateSupplierWeightsUseCase.execute(req.body, updatedBy);
      res.status(200).json({
        success: true,
        data: weights,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
