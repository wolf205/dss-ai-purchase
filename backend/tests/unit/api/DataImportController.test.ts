import { Request, Response } from 'express';
import { DataImportController } from '../../../src/api/controllers/DataImportController';
import { ImportSalesInventoryUseCase } from '../../../src/application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { GetDataImportLogsUseCase } from '../../../src/application/use-cases/ingestion/GetDataImportLogsUseCase';
import { GetImportTemplateUseCase } from '../../../src/application/use-cases/ingestion/GetImportTemplateUseCase';

describe('DataImportController - uploadSalesAndInventory (UC-003 / endpoints-spec 2.4)', () => {
  let mockImportUseCase: jest.Mocked<ImportSalesInventoryUseCase>;
  let mockLogsUseCase: jest.Mocked<GetDataImportLogsUseCase>;
  let mockTemplateUseCase: jest.Mocked<GetImportTemplateUseCase>;
  let controller: DataImportController;

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockImportUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogsUseCase = {
      getLogs: jest.fn(),
      getLogById: jest.fn(),
    } as any;

    mockTemplateUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new DataImportController(mockImportUseCase, mockLogsUseCase, mockTemplateUseCase);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  it('should return 400 FILE_REQUIRED if req.file is missing', async () => {
    req = {
      file: undefined,
      body: {},
    };

    await controller.uploadSalesAndInventory(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FILE_REQUIRED',
        message: 'Vui lòng chọn file Excel hoặc CSV để nạp dữ liệu',
      },
      timestamp: expect.any(String),
    });
    expect(mockImportUseCase.execute).not.toHaveBeenCalled();
  });

  it('should pass req.user?.userId as uploadedBy and return 200 on SUCCESS', async () => {
    const mockFile = {
      buffer: Buffer.from('mock excel data'),
      originalname: 'sales_august.xlsx',
    } as Express.Multer.File;

    const mockResult = {
      importLogId: 'log-uuid-1',
      batchId: 'batch-uuid-1',
      importType: 'SALES_HISTORY' as const,
      fileName: 'sales_august.xlsx',
      status: 'SUCCESS' as const,
      totalRows: 1500,
      successfulRows: 1500,
      failedRows: 0,
      salesRowsImported: 1500,
      inventoryRowsUpdated: 0,
      errors: [],
    };

    mockImportUseCase.execute.mockResolvedValue(mockResult);

    req = {
      file: mockFile,
      body: {
        type: 'SALES_HISTORY',
        overwriteDuplicateDates: true,
      },
      user: { userId: 'user-actual-id' } as any,
    };

    await controller.uploadSalesAndInventory(req as Request, res as Response);

    expect(mockImportUseCase.execute).toHaveBeenCalledWith(
      mockFile.buffer,
      'sales_august.xlsx',
      'user-actual-id',
      'SALES_HISTORY',
      true
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResult,
      timestamp: expect.any(String),
    });
  });

  it('should return 400 VALIDATION_ERROR with error details when status is FAILED', async () => {
    const mockFile = {
      buffer: Buffer.from('mock invalid data'),
      originalname: 'invalid.xlsx',
    } as Express.Multer.File;

    const mockResult = {
      importLogId: 'log-uuid-2',
      batchId: 'batch-uuid-2',
      importType: 'SALES_HISTORY' as const,
      fileName: 'invalid.xlsx',
      status: 'FAILED' as const,
      totalRows: 10,
      successfulRows: 0,
      failedRows: 1,
      salesRowsImported: 0,
      inventoryRowsUpdated: 0,
      errors: [
        {
          rowNumber: 5,
          field: 'sku',
          message: 'Mã SKU "UNKNOWN" chưa tồn tại',
          value: 'UNKNOWN',
        },
      ],
    };

    mockImportUseCase.execute.mockResolvedValue(mockResult);

    req = {
      file: mockFile,
      body: {
        type: 'SALES_HISTORY',
        overwriteDuplicateDates: true,
      },
    };

    await controller.uploadSalesAndInventory(req as Request, res as Response);

    expect(mockImportUseCase.execute).toHaveBeenCalledWith(
      mockFile.buffer,
      'invalid.xlsx',
      undefined,
      'SALES_HISTORY',
      true
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('1 dòng dữ liệu bị lỗi'),
        details: [
          {
            row: 5,
            field: 'sku',
            issue: 'Mã SKU "UNKNOWN" chưa tồn tại',
            value: 'UNKNOWN',
          },
        ],
      },
      data: mockResult,
      timestamp: expect.any(String),
    });
  });

  describe('getTemplate (UC-003 / endpoints-spec 2.5)', () => {
    it('should return 200 and stream template binary file with appropriate headers', async () => {
      const mockBuffer = Buffer.from('mock excel template content');
      mockTemplateUseCase.execute.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'Mau_Nhap_Lieu_SALES_HISTORY.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      req = {
        params: { type: 'SALES_HISTORY' },
        query: { format: 'xlsx' },
      };

      await controller.getTemplate(req as Request, res as Response);

      expect(mockTemplateUseCase.execute).toHaveBeenCalledWith({
        type: 'SALES_HISTORY',
        format: 'xlsx',
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="Mau_Nhap_Lieu_SALES_HISTORY.xlsx"'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', mockBuffer.length);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should return 500 SERVICE_UNAVAILABLE if getImportTemplateUseCase is undefined', async () => {
      const controllerWithoutTemplate = new DataImportController(mockImportUseCase, mockLogsUseCase, undefined);

      req = {
        params: { type: 'SALES_HISTORY' },
        query: {},
      };

      await controllerWithoutTemplate.getTemplate(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SERVICE_UNAVAILABLE',
          }),
        })
      );
    });
  });
});
