import { ExcelTemplateService } from '../../../src/infrastructure/file-parsers/ExcelTemplateService';
import ExcelJS from 'exceljs';

describe('ExcelTemplateService (Dynamic Template Generation)', () => {
  let templateService: ExcelTemplateService;

  beforeEach(() => {
    templateService = new ExcelTemplateService();
  });

  describe('generateImportTemplate for SALES_HISTORY', () => {
    it('should generate a valid XLSX buffer with SalesHistory and Huong_Dan sheets', async () => {
      const result = await templateService.generateImportTemplate('SALES_HISTORY', 'xlsx');

      expect(result.filename).toBe('Mau_Nhap_Lieu_SALES_HISTORY.xlsx');
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);

      // Verify workbook structure using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result.buffer as any);

      expect(workbook.worksheets.length).toBe(2);
      const dataSheet = workbook.getWorksheet('SalesHistory');
      expect(dataSheet).toBeDefined();

      const headerRow = dataSheet!.getRow(1);
      expect(headerRow.getCell(1).text).toBe('SKU');
      expect(headerRow.getCell(2).text).toBe('SaleDate');
      expect(headerRow.getCell(3).text).toBe('QuantitySold');
      expect(headerRow.getCell(4).text).toBe('UnitPrice');

      // Sample data
      expect(dataSheet!.rowCount).toBe(4); // 1 header + 3 sample rows
      const row2 = dataSheet!.getRow(2);
      expect(row2.getCell(1).text).toBe('MILK-VNM-180');
      expect(row2.getCell(2).text).toBe('2026-09-01');

      const guideSheet = workbook.getWorksheet('Huong_Dan');
      expect(guideSheet).toBeDefined();
      expect(guideSheet!.rowCount).toBeGreaterThan(1);
    });

    it('should generate a valid CSV buffer with UTF-8 BOM', async () => {
      const result = await templateService.generateImportTemplate('SALES_HISTORY', 'csv');

      expect(result.filename).toBe('Mau_Nhap_Lieu_SALES_HISTORY.csv');
      expect(result.mimeType).toBe('text/csv; charset=utf-8');

      const content = result.buffer.toString('utf-8');
      expect(content.startsWith('\uFEFF')).toBe(true);
      expect(content).toContain('SKU,SaleDate,QuantitySold,UnitPrice');
      expect(content).toContain('MILK-VNM-180,2026-09-01,24,6200');
    });
  });

  describe('generateImportTemplate for INVENTORY_SNAPSHOT', () => {
    it('should generate a valid XLSX buffer with InventorySnapshots and Huong_Dan sheets', async () => {
      const result = await templateService.generateImportTemplate('INVENTORY_SNAPSHOT', 'xlsx');

      expect(result.filename).toBe('Mau_Nhap_Lieu_INVENTORY_SNAPSHOT.xlsx');
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result.buffer as any);

      expect(workbook.worksheets.length).toBe(2);
      const dataSheet = workbook.getWorksheet('InventorySnapshots');
      expect(dataSheet).toBeDefined();

      const headerRow = dataSheet!.getRow(1);
      expect(headerRow.getCell(1).text).toBe('SKU');
      expect(headerRow.getCell(2).text).toBe('OnHand');

      expect(dataSheet!.rowCount).toBe(4);
      const row2 = dataSheet!.getRow(2);
      expect(row2.getCell(1).text).toBe('MILK-VNM-180');
      expect(row2.getCell(2).value).toBe(120);
    });

    it('should generate a valid CSV buffer with UTF-8 BOM', async () => {
      const result = await templateService.generateImportTemplate('INVENTORY_SNAPSHOT', 'csv');

      expect(result.filename).toBe('Mau_Nhap_Lieu_INVENTORY_SNAPSHOT.csv');
      expect(result.mimeType).toBe('text/csv; charset=utf-8');

      const content = result.buffer.toString('utf-8');
      expect(content.startsWith('\uFEFF')).toBe(true);
      expect(content).toContain('SKU,OnHand');
      expect(content).toContain('MILK-VNM-180,120');
    });
  });
});
