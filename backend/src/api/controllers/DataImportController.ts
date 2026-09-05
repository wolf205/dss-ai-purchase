import { Request, Response, NextFunction } from 'express';
import { ImportSalesInventoryUseCase } from '../../application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { ExcelFileParser } from '../../infrastructure/file-parsers/ExcelFileParser';
import { PrismaProductRepository } from '../../infrastructure/repositories/PrismaProductRepository';
import { PrismaSalesHistoryRepository } from '../../infrastructure/repositories/PrismaSalesHistoryRepository';
import { PrismaInventoryRepository } from '../../infrastructure/repositories/PrismaInventoryRepository';
import { PrismaDataImportLogRepository } from '../../infrastructure/repositories/PrismaDataImportLogRepository';
import { PrismaUnitOfWork } from '../../infrastructure/database/PrismaUnitOfWork';

const fileParser = new ExcelFileParser();
const productRepository = new PrismaProductRepository();
const salesHistoryRepository = new PrismaSalesHistoryRepository();
const inventoryRepository = new PrismaInventoryRepository();
const dataImportLogRepository = new PrismaDataImportLogRepository();
const unitOfWork = new PrismaUnitOfWork();

const importSalesInventoryUseCase = new ImportSalesInventoryUseCase(
  fileParser,
  productRepository,
  salesHistoryRepository,
  inventoryRepository,
  dataImportLogRepository,
  unitOfWork
);

export class DataImportController {
  public static async uploadSalesAndInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Vui lòng chọn file Excel hoặc CSV để nạp dữ liệu',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const uploadedBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
      const result = await importSalesInventoryUseCase.execute(
        req.file.buffer,
        req.file.originalname,
        uploadedBy
      );

      const statusCode = result.status === 'SUCCESS' ? 200 : 400;
      res.status(statusCode).json({
        success: result.status === 'SUCCESS',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getImportLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await dataImportLogRepository.findAll({ limit, offset });

      res.status(200).json({
        success: true,
        data: result.logs,
        meta: {
          total: result.total,
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getImportLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await dataImportLogRepository.findById(req.params.id);
      if (!log) {
        res.status(404).json({
          success: false,
          error: {
            code: 'IMPORT_LOG_NOT_FOUND',
            message: 'Không tìm thấy nhật ký nạp dữ liệu',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: log,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
