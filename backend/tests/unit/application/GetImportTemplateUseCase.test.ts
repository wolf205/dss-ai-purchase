import { GetImportTemplateUseCase } from '../../../src/application/use-cases/ingestion/GetImportTemplateUseCase';
import { ITemplateService, GeneratedTemplateResult } from '../../../src/application/ports/ITemplateService';
import { ValidationException } from '../../../src/application/exceptions';

describe('GetImportTemplateUseCase (UC-003 / endpoints-spec 2.5)', () => {
  let mockTemplateService: jest.Mocked<ITemplateService>;
  let useCase: GetImportTemplateUseCase;

  beforeEach(() => {
    mockTemplateService = {
      generateImportTemplate: jest.fn(),
    };
    useCase = new GetImportTemplateUseCase(mockTemplateService);
  });

  it('should generate SALES_HISTORY xlsx template by default', async () => {
    const mockResult: GeneratedTemplateResult = {
      buffer: Buffer.from('mock xlsx content'),
      filename: 'Mau_Nhap_Lieu_SALES_HISTORY.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    mockTemplateService.generateImportTemplate.mockResolvedValue(mockResult);

    const result = await useCase.execute({ type: 'SALES_HISTORY' });

    expect(mockTemplateService.generateImportTemplate).toHaveBeenCalledWith('SALES_HISTORY', 'xlsx');
    expect(result).toEqual(mockResult);
  });

  it('should generate SALES_HISTORY csv template when format is csv', async () => {
    const mockResult: GeneratedTemplateResult = {
      buffer: Buffer.from('mock csv content'),
      filename: 'Mau_Nhap_Lieu_SALES_HISTORY.csv',
      mimeType: 'text/csv; charset=utf-8',
    };
    mockTemplateService.generateImportTemplate.mockResolvedValue(mockResult);

    const result = await useCase.execute({ type: 'sales_history', format: 'csv' });

    expect(mockTemplateService.generateImportTemplate).toHaveBeenCalledWith('SALES_HISTORY', 'csv');
    expect(result).toEqual(mockResult);
  });

  it('should normalize STOCK_INVENTORY to INVENTORY_SNAPSHOT', async () => {
    const mockResult: GeneratedTemplateResult = {
      buffer: Buffer.from('mock inventory template'),
      filename: 'Mau_Nhap_Lieu_INVENTORY_SNAPSHOT.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    mockTemplateService.generateImportTemplate.mockResolvedValue(mockResult);

    const result = await useCase.execute({ type: 'STOCK_INVENTORY', format: 'xlsx' });

    expect(mockTemplateService.generateImportTemplate).toHaveBeenCalledWith('INVENTORY_SNAPSHOT', 'xlsx');
    expect(result).toEqual(mockResult);
  });

  it('should generate INVENTORY_SNAPSHOT when type is inventory_snapshot', async () => {
    const mockResult: GeneratedTemplateResult = {
      buffer: Buffer.from('mock inventory template'),
      filename: 'Mau_Nhap_Lieu_INVENTORY_SNAPSHOT.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    mockTemplateService.generateImportTemplate.mockResolvedValue(mockResult);

    const result = await useCase.execute({ type: 'INVENTORY_SNAPSHOT' });

    expect(mockTemplateService.generateImportTemplate).toHaveBeenCalledWith('INVENTORY_SNAPSHOT', 'xlsx');
    expect(result).toEqual(mockResult);
  });

  it('should throw ValidationException when template type is unsupported', async () => {
    await expect(
      useCase.execute({ type: 'UNKNOWN_TYPE' as any })
    ).rejects.toThrow(ValidationException);

    await expect(
      useCase.execute({ type: 'UNKNOWN_TYPE' as any })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('Loại tệp tin mẫu không hợp lệ'),
      })
    );

    expect(mockTemplateService.generateImportTemplate).not.toHaveBeenCalled();
  });
});
