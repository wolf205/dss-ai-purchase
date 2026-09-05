import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';
import { PrismaProductRepository } from '../../infrastructure/repositories/PrismaProductRepository';
import { PrismaInventoryRepository } from '../../infrastructure/repositories/PrismaInventoryRepository';

const productRepository = new PrismaProductRepository();
const inventoryRepository = new PrismaInventoryRepository();

const createProductUseCase = new CreateProductUseCase(productRepository, inventoryRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);

export class ProductController {
  public static async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const search = req.query.search as string | undefined;

      const result = await getProductsUseCase.execute({
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
    } catch (error) {
      next(error);
    }
  }

  public static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await getProductsUseCase.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductBySku(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await getProductDetailUseCase.execute(req.params.sku);
      res.status(200).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await createProductUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await updateProductUseCase.execute(req.params.sku, req.body);
      res.status(200).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
