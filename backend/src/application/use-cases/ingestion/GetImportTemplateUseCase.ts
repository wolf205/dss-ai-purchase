import {
  ITemplateService,
  ImportTemplateType,
  ImportTemplateFormat,
  GeneratedTemplateResult,
} from '../../ports/ITemplateService';
import { ValidationException } from '../../exceptions';

export interface GetImportTemplateRequestDTO {
  type: string;
  format?: 'xlsx' | 'csv';
}

export class GetImportTemplateUseCase {
  constructor(private readonly templateService: ITemplateService) {}

  public async execute(dto: GetImportTemplateRequestDTO): Promise<GeneratedTemplateResult> {
    const rawType = dto.type?.trim().toUpperCase();
    let normalizedType: ImportTemplateType;

    if (rawType === 'SALES_HISTORY') {
      normalizedType = 'SALES_HISTORY';
    } else if (rawType === 'INVENTORY_SNAPSHOT' || rawType === 'STOCK_INVENTORY') {
      normalizedType = 'INVENTORY_SNAPSHOT';
    } else {
      throw new ValidationException(
        `Loại tệp tin mẫu không hợp lệ: "${dto.type}". Hệ thống hỗ trợ: SALES_HISTORY, INVENTORY_SNAPSHOT (hoặc STOCK_INVENTORY).`,
        'INVALID_TEMPLATE_TYPE'
      );
    }

    const format: ImportTemplateFormat =
      dto.format?.toLowerCase() === 'csv' ? 'csv' : 'xlsx';

    return this.templateService.generateImportTemplate(normalizedType, format);
  }
}
