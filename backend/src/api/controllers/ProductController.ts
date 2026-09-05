import { Request, Response } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase
  ) {}

  public listProducts = async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const category = req.query.category as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const search = req.query.search as string | undefined;

    const result = await this.getProductsUseCase.execute({
      page,
      limit,
      category,
      isActive,
      search,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
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

  public createProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.createProductUseCase.execute(req.body);
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
}
