export type ImportType = 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT';

export interface ImportErrorDetail {
  row: number;
  field: string;
  issue: string;
}

export interface ImportResultData {
  batchId: string;
  fileName: string;
  importType: ImportType;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  details?: ImportErrorDetail[];
}
