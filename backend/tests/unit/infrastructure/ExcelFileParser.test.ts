import ExcelJS from 'exceljs';
import { ExcelFileParser } from '../../../src/infrastructure/file-parsers/ExcelFileParser';

describe('ExcelFileParser (UC-003, BR-009, BR-010)', () => {
  let parser: ExcelFileParser;

  beforeEach(() => {
    parser = new ExcelFileParser();
  });

  it('should parse valid Excel workbook with SalesHistory and InventorySnapshots', async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: SalesHistory
    const salesSheet = workbook.addWorksheet('SalesHistory');
    salesSheet.addRow(['sku', 'sale_date', 'quantity_sold', 'unit_selling_price']);
    salesSheet.addRow(['MILK-001', '2026-09-01', 10, 15000]);
    salesSheet.addRow(['BREAD-002', '2026-09-02', 5, 20000]);

    // Sheet 2: InventorySnapshots
    const invSheet = workbook.addWorksheet('InventorySnapshots');
    invSheet.addRow(['sku', 'on_hand']);
    invSheet.addRow(['MILK-001', 50]);
    invSheet.addRow(['BREAD-002', 20]);

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    const result = await parser.parseSalesAndInventoryFile(buffer, 'test_import.xlsx');

    expect(result.errors).toHaveLength(0);
    expect(result.salesRows).toHaveLength(2);
    expect(result.inventoryRows).toHaveLength(2);
    expect(result.salesRows[0].sku).toBe('MILK-001');
    expect(result.salesRows[0].quantitySold).toBe(10);
    expect(result.inventoryRows[0].onHand).toBe(50);
  });

  it('should return detailed errors when rows have negative quantity or future date (BR-009, BR-010)', async () => {
    const workbook = new ExcelJS.Workbook();
    const salesSheet = workbook.addWorksheet('SalesHistory');
    salesSheet.addRow(['sku', 'sale_date', 'quantity_sold', 'unit_selling_price']);
    salesSheet.addRow(['MILK-001', '2026-09-01', -5, 15000]); // Negative quantity
    salesSheet.addRow(['', '2026-09-01', 10, 15000]); // Missing SKU
    salesSheet.addRow(['BREAD-002', '2099-01-01', 10, 15000]); // Future date

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    const result = await parser.parseSalesAndInventoryFile(buffer, 'invalid_import.xlsx');

    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    const errorFields = result.errors.map((e) => e.field);
    expect(errorFields).toContain('quantity_sold');
    expect(errorFields).toContain('sku');
    expect(errorFields).toContain('sale_date');
  });
});
