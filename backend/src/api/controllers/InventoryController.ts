import { Request, Response, NextFunction } from 'express';
import { GetInventoryDashboardUseCase } from '../../application/use-cases/inventory/GetInventoryDashboardUseCase';
import { GetInventoryItemsUseCase } from '../../application/use-cases/inventory/GetInventoryItemsUseCase';
import { GetAbcXyzMatrixUseCase } from '../../application/use-cases/inventory/GetAbcXyzMatrixUseCase';

export class InventoryController {
  constructor(
    private readonly getInventoryDashboardUseCase: GetInventoryDashboardUseCase,
    private readonly getInventoryItemsUseCase: GetInventoryItemsUseCase,
    private readonly getAbcXyzMatrixUseCase: GetAbcXyzMatrixUseCase
  ) {}

  public getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.getInventoryDashboardUseCase.execute();
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public getItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = (page - 1) * limit;

      const riskLevel = req.query.riskLevel as string | undefined;
      const isDeadStock =
        req.query.isDeadStock !== undefined
          ? req.query.isDeadStock === 'true'
          : undefined;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const { items, total } = await this.getInventoryItemsUseCase.execute({
        riskLevel,
        isDeadStock,
        category,
        search,
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      res.status(200).json({
        success: true,
        data: items,
        meta: {
          page,
          limit,
          totalItems: total,
          total, // compatibility with both formats
          totalPages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public getAbcXyzMatrix = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.getAbcXyzMatrixUseCase.execute();
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}
