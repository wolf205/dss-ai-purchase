import { getPrismaClient } from '../database/prisma';
import { DataImportLog, ImportStatus, ImportType } from '../../domain/entities/DataImportLog';
import { IDataImportLogRepository } from '../../domain/repositories/IDataImportLogRepository';

export class PrismaDataImportLogRepository implements IDataImportLogRepository {
  public async findById(id: string): Promise<DataImportLog | null> {
    const prisma = getPrismaClient();
    const record = await prisma.dataImportLog.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAll(options?: { limit?: number; offset?: number }): Promise<{ logs: DataImportLog[]; total: number }> {
    const prisma = getPrismaClient();
    const [records, total] = await Promise.all([
      prisma.dataImportLog.findMany({
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataImportLog.count(),
    ]);

    return {
      logs: records.map((r) => this.toDomain(r)),
      total,
    };
  }

  public async save(log: DataImportLog): Promise<DataImportLog> {
    const prisma = getPrismaClient();
    const record = await prisma.dataImportLog.create({
      data: {
        id: log.id,
        fileName: log.fileName,
        fileSizeBytes: log.fileSizeBytes,
        importType: log.importType as any,
        totalRows: log.totalRows,
        successfulRows: log.successfulRows,
        failedRows: log.failedRows,
        status: log.status as any,
        errorDetails: log.errorDetails ?? undefined,
        importedBy: log.importedBy ?? undefined,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: any): DataImportLog {
    return new DataImportLog({
      id: record.id,
      fileName: record.fileName,
      fileSizeBytes: record.fileSizeBytes,
      importType: record.importType as ImportType,
      totalRows: record.totalRows,
      successfulRows: record.successfulRows,
      failedRows: record.failedRows,
      status: record.status as ImportStatus,
      errorDetails: record.errorDetails,
      importedBy: record.importedBy,
      createdAt: record.createdAt,
    });
  }
}
