export type ImportTemplateType = 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT';
export type ImportTemplateFormat = 'xlsx' | 'csv';

export interface GeneratedTemplateResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface ITemplateService {
  generateImportTemplate(
    type: ImportTemplateType,
    format: ImportTemplateFormat
  ): Promise<GeneratedTemplateResult>;
}
