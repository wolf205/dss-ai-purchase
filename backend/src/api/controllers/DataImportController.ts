import { Request, Response } from 'express';
import { ImportSalesInventoryUseCase } from '../../application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { PrismaDataImportLogRepository } from '../../infrastructure/repositories/PrismaDataImportLogRepository';

export class DataImportController {
  constructor(
    private readonly importSalesInventoryUseCase: ImportSalesInventoryUseCase,
    private readonly dataImportLogRepository: PrismaDataImportLogRepository
  ) {}

  public uploadSalesAndInventory = async (req: Request, res: Response): Promise<void> => {
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
    const result = await this.importSalesInventoryUseCase.execute(
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
  };

  public getImportLogs = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await this.dataImportLogRepository.findAll({ limit, offset });

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
  };

  public getImportLogById = async (req: Request, res: Response): Promise<void> => {
    const log = await this.dataImportLogRepository.findById(req.params.id);
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
  };
}
