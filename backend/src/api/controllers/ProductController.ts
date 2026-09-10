import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';
import { GetProduct360UseCase } from '../../application/use-cases/product/GetProduct360UseCase';
import { UpdateProductStatusUseCase } from '../../application/use-cases/product/UpdateProductStatusUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
    private readonly getProduct360UseCase?: GetProduct360UseCase,
    private readonly updateProductStatusUseCase?: UpdateProductStatusUseCase
  ) {}

  public listProducts = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as {
      page?: number;
      limit?: number;
      category?: string;
      isActive?: boolean;
      search?: string;
      sortBy?: 'sku' | 'name' | 'category' | 'costPrice' | 'sellingPrice' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.getProductsUseCase.execute({
      page,
      limit,
      category: query.category,
      isActive: query.isActive,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      meta: buildPaginationMeta(page, limit, result.total),
      timestamp: new Date().toISOString(),
    });
  };

  public getCategories = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.getProductsUseCase.getCategories();
    res.status(200).json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  };

  public getProductBySku = async (req: Request, res: Response): Promise<void> => {
    const product = await this.getProductDetailUseCase.execute(req.params.sku);
    res.status(200).json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    });
  };

  public getProduct360 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.getProduct360UseCase) {
        res.status(501).json({ success: false, error: { message: 'Not implemented' } });
        return;
      }
      const data = await this.getProduct360UseCase.execute(req.params.sku);
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public createProduct = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const product = await this.createProductUseCase.execute(req.body, operatorUserId, ipAddress);
    res.status(201).json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    });
  };

  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.updateProductUseCase.execute(req.params.sku, req.body);
    res.status(200).json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    });
  };

  public updateProductStatus = async (req: Request, res: Response): Promise<void> => {
    if (!this.updateProductStatusUseCase) {
      res.status(501).json({ success: false, error: { message: 'Not implemented' } });
      return;
    }
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const result = await this.updateProductStatusUseCase.execute(
      req.params.sku,
      req.body.isActive,
      operatorUserId,
      ipAddress
    );
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };
}
