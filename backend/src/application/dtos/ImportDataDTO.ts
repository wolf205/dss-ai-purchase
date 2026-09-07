import { FileParseError } from '../ports/IFileParser';
import { ImportStatus, ImportType } from '../../domain/entities/DataImportLog';

export interface ImportDataResponseDTO {
  importLogId: string;
  batchId?: string; // Contract alias matching docs/06-api-design & frontend
  importType?: ImportType;
  fileName: string;
  status: ImportStatus;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  salesRowsImported: number;
  inventoryRowsUpdated: number;
  errors: FileParseError[];
}

export interface ImportLogResponseDTO {
  id: string;
  fileName: string;
  importType: ImportType;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: ImportStatus;
  errorDetails?: any;
  importedBy?: string | null;
  createdAt: Date;
}
