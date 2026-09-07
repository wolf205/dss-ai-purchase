import { Request, Response } from 'express';
import { ImportSalesInventoryUseCase } from '../../application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { GetDataImportLogsUseCase } from '../../application/use-cases/ingestion/GetDataImportLogsUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class DataImportController {
  constructor(
    private readonly importSalesInventoryUseCase: ImportSalesInventoryUseCase,
    private readonly getDataImportLogsUseCase: GetDataImportLogsUseCase
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
    const type = (req.body.type || req.body.importType) as 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT' | undefined;
    const overwriteDuplicateDates = req.body.overwriteDuplicateDates === 'false' || req.body.overwriteDuplicateDates === false ? false : true;

    const result = await this.importSalesInventoryUseCase.execute(
      req.file.buffer,
      req.file.originalname,
      uploadedBy,
      type,
      overwriteDuplicateDates
    );

    if (result.status === 'SUCCESS') {
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Tệp tin chứa ${result.failedRows} dòng dữ liệu bị lỗi. Vui lòng sửa lại theo danh sách đính kèm (BR-010).`,
        details: result.errors.map((e) => ({
          row: e.rowNumber,
          field: e.field,
          issue: e.message,
          value: e.value,
        })),
      },
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public getImportLogs = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : (page - 1) * limit;

    const result = await this.getDataImportLogsUseCase.getLogs({ limit, offset });

    res.status(200).json({
      success: true,
      data: result.logs,
      meta: {
        ...buildPaginationMeta(page, limit, result.total),
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  };

  public getImportLogById = async (req: Request, res: Response): Promise<void> => {
    const log = await this.getDataImportLogsUseCase.getLogById(req.params.id);

    res.status(200).json({
      success: true,
      data: log,
      timestamp: new Date().toISOString(),
    });
  };
}

