export type ImportType = 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT';
export type ImportStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface DataImportLogProps {
  id?: string;
  fileName: string;
  fileSizeBytes?: number | bigint;
  importType: ImportType;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: ImportStatus;
  errorDetails?: any;
  importedBy?: string | null;
  createdAt?: Date;
}

export class DataImportLog {
  public readonly id?: string;
  public readonly fileName: string;
  public readonly fileSizeBytes: bigint;
  public readonly importType: ImportType;
  public readonly totalRows: number;
  public readonly successfulRows: number;
  public readonly failedRows: number;
  public readonly status: ImportStatus;
  public readonly errorDetails?: any;
  public readonly importedBy?: string | null;
  public readonly createdAt: Date;

  constructor(props: DataImportLogProps) {
    this.id = props.id;
    this.fileName = props.fileName;
    this.fileSizeBytes = typeof props.fileSizeBytes === 'bigint' ? props.fileSizeBytes : BigInt(props.fileSizeBytes ?? 0);
    this.importType = props.importType;
    this.totalRows = props.totalRows;
    this.successfulRows = props.successfulRows;
    this.failedRows = props.failedRows;
    this.status = props.status;
    this.errorDetails = props.errorDetails;
    this.importedBy = props.importedBy;
    this.createdAt = props.createdAt ?? new Date();
  }
}
