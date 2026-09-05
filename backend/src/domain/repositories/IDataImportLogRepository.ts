import { DataImportLog } from '../entities/DataImportLog';

export interface IDataImportLogRepository {
  findById(id: string): Promise<DataImportLog | null>;
  findAll(options?: { limit?: number; offset?: number }): Promise<{ logs: DataImportLog[]; total: number }>;
  save(log: DataImportLog): Promise<DataImportLog>;
}
