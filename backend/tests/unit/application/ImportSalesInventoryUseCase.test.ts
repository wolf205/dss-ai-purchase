import { ImportSalesInventoryUseCase } from '../../../src/application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { IFileParser } from '../../../src/application/ports/IFileParser';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { ISalesHistoryRepository } from '../../../src/domain/repositories/ISalesHistoryRepository';
import { IInventoryRepository } from '../../../src/domain/repositories/IInventoryRepository';
import { IDataImportLogRepository } from '../../../src/domain/repositories/IDataImportLogRepository';
import { IUnitOfWork } from '../../../src/application/ports/IUnitOfWork';

describe('ImportSalesInventoryUseCase (UC-003, BR-009, BR-010, BR-018)', () => {
  let mockFileParser: jest.Mocked<IFileParser>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockSalesRepo: jest.Mocked<ISalesHistoryRepository>;
  let mockInvRepo: jest.Mocked<IInventoryRepository>;
  let mockLogRepo: jest.Mocked<IDataImportLogRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let useCase: ImportSalesInventoryUseCase;

  beforeEach(() => {
    mockFileParser = {
      parseSalesAndInventoryFile: jest.fn(),
    };
    mockProductRepo = {
      findBySku: jest.fn(),
      findAll: jest.fn(),
      findAllCategories: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      exists: jest.fn(),
    };
    mockSalesRepo = {
      findByProductSku: jest.fn(),
      saveBatch: jest.fn(),
      getDailyAggregates: jest.fn(),
    };
    mockInvRepo = {
      findByProductSku: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateOnHand: jest.fn(),
      updateOnOrder: jest.fn(),
    };
    mockLogRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((log) => Promise.resolve({ ...log, id: 'log-123' })),
    };
    mockUnitOfWork = {
      executeInTransaction: jest.fn().mockImplementation((fn) => fn()),
    };

    useCase = new ImportSalesInventoryUseCase(
      mockFileParser,
      mockProductRepo,
      mockSalesRepo,
      mockInvRepo,
      mockLogRepo,
      mockUnitOfWork
    );
  });

  it('should reject import and save failed log if parser returns errors (BR-010)', async () => {
    mockFileParser.parseSalesAndInventoryFile.mockResolvedValue({
      salesRows: [],
      inventoryRows: [],
      errors: [
        {
          rowNumber: 2,
          field: 'quantity_sold',
          message: 'Số lượng bán không được là số âm (BR-009)',
        },
      ],
    });

    const result = await useCase.execute(Buffer.from('mock'), 'sales.xlsx', 'user-123');

    expect(result.status).toBe('FAILED');
    expect(result.errors).toHaveLength(1);
    expect(mockSalesRepo.saveBatch).not.toHaveBeenCalled();
    expect(mockInvRepo.updateOnHand).not.toHaveBeenCalled();
    expect(mockLogRepo.save).toHaveBeenCalled();
  });

  it('should reject import if any SKU does not exist in database (BR-010)', async () => {
    mockFileParser.parseSalesAndInventoryFile.mockResolvedValue({
      salesRows: [
        {
          sku: 'NON-EXISTING-SKU',
          saleDate: new Date('2026-09-01'),
          quantitySold: 10,
          unitSellingPrice: 15000,
          rowNumber: 2,
        },
      ],
      inventoryRows: [],
      errors: [],
    });

    mockProductRepo.exists.mockResolvedValue(false);

    const result = await useCase.execute(Buffer.from('mock'), 'sales.xlsx', 'user-123');

    expect(result.status).toBe('FAILED');
    expect(result.errors.some((e) => e.message.includes('chưa tồn tại'))).toBe(true);
    expect(mockSalesRepo.saveBatch).not.toHaveBeenCalled();
  });

  it('should execute atomic transaction and import data when all rows and SKUs are valid', async () => {
    mockFileParser.parseSalesAndInventoryFile.mockResolvedValue({
      salesRows: [
        {
          sku: 'VALID-SKU',
          saleDate: new Date('2026-09-01'),
          quantitySold: 10,
          unitSellingPrice: 15000,
          rowNumber: 2,
        },
      ],
      inventoryRows: [
        {
          sku: 'VALID-SKU',
          onHand: 100,
          rowNumber: 2,
        },
      ],
      errors: [],
    });

    mockProductRepo.exists.mockResolvedValue(true);

    const result = await useCase.execute(Buffer.from('mock'), 'sales.xlsx', 'user-123');

    expect(result.status).toBe('SUCCESS');
    expect(result.salesRowsImported).toBe(1);
    expect(result.inventoryRowsUpdated).toBe(1);
    expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    expect(mockSalesRepo.saveBatch).toHaveBeenCalled();
    expect(mockInvRepo.updateOnHand).toHaveBeenCalledWith('VALID-SKU', 100);
  });
});
