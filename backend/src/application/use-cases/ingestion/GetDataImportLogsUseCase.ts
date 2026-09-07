import { IDataImportLogRepository } from '../../../domain/repositories/IDataImportLogRepository';
import { ImportLogResponseDTO } from '../../dtos/ImportDataDTO';
import { EntityNotFoundException } from '../../exceptions/EntityNotFoundException';

export class GetDataImportLogsUseCase {
  constructor(private readonly dataImportLogRepository: IDataImportLogRepository) {}

  public async getLogs(options?: { limit?: number; offset?: number }): Promise<{ logs: ImportLogResponseDTO[]; total: number }> {
    const result = await this.dataImportLogRepository.findAll(options);
    return {
      total: result.total,
      logs: result.logs.map((log) => ({
        id: log.id || '',
        fileName: log.fileName,
        importType: log.importType,
        totalRows: log.totalRows,
        successfulRows: log.successfulRows,
        failedRows: log.failedRows,
        status: log.status,
        errorDetails: log.errorDetails,
        importedBy: log.importedBy,
        createdAt: log.createdAt,
      })),
    };
  }

  public async getLogById(id: string): Promise<ImportLogResponseDTO> {
    const log = await this.dataImportLogRepository.findById(id);
    if (!log) {
      throw new EntityNotFoundException('nhật ký nạp dữ liệu', id);
    }
    return {
      id: log.id || '',
      fileName: log.fileName,
      importType: log.importType,
      totalRows: log.totalRows,
      successfulRows: log.successfulRows,
      failedRows: log.failedRows,
      status: log.status,
      errorDetails: log.errorDetails,
      importedBy: log.importedBy,
      createdAt: log.createdAt,
    };
  }
}
