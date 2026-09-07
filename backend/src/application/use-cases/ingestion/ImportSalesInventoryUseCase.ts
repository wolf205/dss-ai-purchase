import { IFileParser, FileParseError } from '../../ports/IFileParser';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ISalesHistoryRepository } from '../../../domain/repositories/ISalesHistoryRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { IDataImportLogRepository } from '../../../domain/repositories/IDataImportLogRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { ImportDataResponseDTO } from '../../dtos/ImportDataDTO';
import { SalesHistory } from '../../../domain/entities/SalesHistory';
import { DataImportLog } from '../../../domain/entities/DataImportLog';

export class ImportSalesInventoryUseCase {
  constructor(
    private readonly fileParser: IFileParser,
    private readonly productRepository: IProductRepository,
    private readonly salesHistoryRepository: ISalesHistoryRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly dataImportLogRepository: IDataImportLogRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  public async execute(
    buffer: Buffer,
    originalFilename: string,
    uploadedBy: string,
    requestedImportType?: 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT',
    overwriteDuplicateDates: boolean = true
  ): Promise<ImportDataResponseDTO> {
    // 1. Parse Excel / CSV File (BR-009, BR-010)
    const parseResult = await this.fileParser.parseSalesAndInventoryFile(
      buffer,
      originalFilename,
      requestedImportType
    );
    const errors: FileParseError[] = [...parseResult.errors];

    const totalRows = parseResult.salesRows.length + parseResult.inventoryRows.length + errors.length;
    const finalImportType: 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT' =
      requestedImportType || (parseResult.inventoryRows.length > 0 ? 'INVENTORY_SNAPSHOT' : 'SALES_HISTORY');

    // 2. Validate SKU existence for all rows & fetch basePrice for fallback
    const uniqueSkus = new Set<string>();
    parseResult.salesRows.forEach((r) => uniqueSkus.add(r.sku));
    parseResult.inventoryRows.forEach((r) => uniqueSkus.add(r.sku));

    const skuExistenceMap = new Map<string, boolean>();
    const productPriceMap = new Map<string, number>();

    await Promise.all(
      Array.from(uniqueSkus).map(async (sku) => {
        const exists = await this.productRepository.exists(sku);
        skuExistenceMap.set(sku, exists);
        if (exists) {
          const product = await this.productRepository.findBySku(sku);
          if (product) {
            productPriceMap.set(sku, product.sellingPrice);
          }
        }
      })
    );

    // Check sales rows SKUs
    for (const row of parseResult.salesRows) {
      if (!skuExistenceMap.get(row.sku)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'sku',
          message: `Mã SKU "${row.sku}" chưa tồn tại trong danh mục sản phẩm tại dòng ${row.rowNumber} (BR-010)`,
          value: row.sku,
        });
      }
    }

    // Check inventory rows SKUs
    for (const row of parseResult.inventoryRows) {
      if (!skuExistenceMap.get(row.sku)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'sku',
          message: `Mã SKU tồn kho "${row.sku}" chưa tồn tại trong danh mục sản phẩm tại dòng ${row.rowNumber} (BR-010)`,
          value: row.sku,
        });
      }
    }

    // 3. If any validation errors exist, reject whole file (BR-010)
    if (errors.length > 0) {
      const failedLog = new DataImportLog({
        fileName: originalFilename,
        fileSizeBytes: buffer.length,
        importType: finalImportType,
        totalRows,
        successfulRows: 0,
        failedRows: errors.length,
        status: 'FAILED',
        errorDetails: errors,
        importedBy: uploadedBy,
      });
      const savedLog = await this.dataImportLogRepository.save(failedLog);

      return {
        importLogId: savedLog.id || '',
        batchId: savedLog.id || '',
        importType: finalImportType,
        fileName: originalFilename,
        status: 'FAILED',
        totalRows,
        successfulRows: 0,
        failedRows: errors.length,
        salesRowsImported: 0,
        inventoryRowsUpdated: 0,
        errors,
      };
    }

    // 4. Zero errors: Execute Atomic Ingestion in Transaction (BR-018)
    const successfulSalesCount = parseResult.salesRows.length;
    const successfulInventoryCount = parseResult.inventoryRows.length;

    const savedLog = await this.unitOfWork.executeInTransaction(async () => {
      // 4a. Record DataImportLog first to obtain batchId
      const log = new DataImportLog({
        fileName: originalFilename,
        fileSizeBytes: buffer.length,
        importType: finalImportType,
        totalRows,
        successfulRows: totalRows,
        failedRows: 0,
        status: 'SUCCESS',
        importedBy: uploadedBy,
      });

      const savedImportLog = await this.dataImportLogRepository.save(log);
      const batchId = savedImportLog.id;

      // 4b. Batch save Sales History records (with fallback pricing if unitSellingPrice is 0)
      if (parseResult.salesRows.length > 0) {
        const salesEntities = parseResult.salesRows.map((r) => {
          const unitPrice = r.unitSellingPrice > 0 ? r.unitSellingPrice : (productPriceMap.get(r.sku) || 0);
          return new SalesHistory({
            productSku: r.sku,
            saleDate: r.saleDate,
            quantitySold: r.quantitySold,
            revenue: Math.round(r.quantitySold * unitPrice * 100) / 100,
            source: 'IMPORT_EXCEL',
            importBatchId: batchId,
          });
        });
        await this.salesHistoryRepository.saveBatch(salesEntities, overwriteDuplicateDates);
      }

      // 4c. Update Inventory On-Hand records
      if (parseResult.inventoryRows.length > 0) {
        for (const row of parseResult.inventoryRows) {
          await this.inventoryRepository.updateOnHand(row.sku, row.onHand);
        }
      }

      return savedImportLog;
    });

    return {
      importLogId: savedLog.id || '',
      batchId: savedLog.id || '',
      importType: finalImportType,
      fileName: originalFilename,
      status: 'SUCCESS',
      totalRows,
      successfulRows: totalRows,
      failedRows: 0,
      salesRowsImported: successfulSalesCount,
      inventoryRowsUpdated: successfulInventoryCount,
      errors: [],
    };
  }
}

