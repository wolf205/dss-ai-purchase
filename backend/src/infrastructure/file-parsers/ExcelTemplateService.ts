import ExcelJS from 'exceljs';
import {
  ITemplateService,
  ImportTemplateType,
  ImportTemplateFormat,
  GeneratedTemplateResult,
} from '../../application/ports/ITemplateService';

export class ExcelTemplateService implements ITemplateService {
  public async generateImportTemplate(
    type: ImportTemplateType,
    format: ImportTemplateFormat
  ): Promise<GeneratedTemplateResult> {
    const filename = `Mau_Nhap_Lieu_${type}.${format}`;
    const mimeType =
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8';

    if (format === 'csv') {
      const buffer = this.generateCsvBuffer(type);
      return { buffer, filename, mimeType };
    }

    const buffer = await this.generateXlsxBuffer(type);
    return { buffer, filename, mimeType };
  }

  private generateCsvBuffer(type: ImportTemplateType): Buffer {
    let csvContent = '';
    if (type === 'SALES_HISTORY') {
      csvContent =
        'SKU,SaleDate,QuantitySold,UnitPrice\r\n' +
        'MILK-VNM-180,2026-09-01,24,6200\r\n' +
        'BEER-TIGER-330,2026-09-01,48,16000\r\n' +
        'NOODLE-HAOHAO-75,2026-09-01,60,4500\r\n';
    } else {
      csvContent =
        'SKU,OnHand\r\n' +
        'MILK-VNM-180,120\r\n' +
        'BEER-TIGER-330,85\r\n' +
        'NOODLE-HAOHAO-75,200\r\n';
    }

    // UTF-8 BOM (\uFEFF) ensures Excel on Windows renders Vietnamese characters correctly
    return Buffer.from('\uFEFF' + csvContent, 'utf-8');
  }

  private async generateXlsxBuffer(type: ImportTemplateType): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DSS AI Purchase System';
    workbook.lastModifiedBy = 'DSS AI Purchase System';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (type === 'SALES_HISTORY') {
      this.buildSalesHistoryWorkbook(workbook);
    } else {
      this.buildInventorySnapshotWorkbook(workbook);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private buildSalesHistoryWorkbook(workbook: ExcelJS.Workbook): void {
    // 1. Main Data Sheet
    const sheet = workbook.addWorksheet('SalesHistory', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 22 },
      { header: 'SaleDate', key: 'saleDate', width: 16 },
      { header: 'QuantitySold', key: 'quantitySold', width: 16 },
      { header: 'UnitPrice', key: 'unitPrice', width: 16 },
    ];

    this.styleHeaderRow(sheet);

    // Sample data rows
    sheet.addRow({ sku: 'MILK-VNM-180', saleDate: '2026-09-01', quantitySold: 24, unitPrice: 6200 });
    sheet.addRow({ sku: 'BEER-TIGER-330', saleDate: '2026-09-01', quantitySold: 48, unitPrice: 16000 });
    sheet.addRow({ sku: 'NOODLE-HAOHAO-75', saleDate: '2026-09-01', quantitySold: 60, unitPrice: 4500 });

    this.styleDataRows(sheet, [
      { col: 1, alignment: { horizontal: 'left' } },
      { col: 2, alignment: { horizontal: 'center' } },
      { col: 3, alignment: { horizontal: 'right' }, numFmt: '#,##0' },
      { col: 4, alignment: { horizontal: 'right' }, numFmt: '#,##0' },
    ]);

    // 2. Guide / Instruction Sheet
    const guideSheet = workbook.addWorksheet('Huong_Dan', {
      views: [{ showGridLines: true }],
    });

    guideSheet.columns = [
      { header: 'Tên Cột (Header)', key: 'column', width: 20 },
      { header: 'Bắt Buộc?', key: 'required', width: 15 },
      { header: 'Kiểu Dữ Liệu', key: 'dataType', width: 20 },
      { header: 'Quy Tắc Nghiệp Vụ & Ví Dụ (BR-010)', key: 'rule', width: 55 },
    ];

    this.styleHeaderRow(guideSheet);

    guideSheet.addRow({
      column: 'SKU',
      required: 'BẮT BUỘC',
      dataType: 'Chuỗi văn bản (Text)',
      rule: 'Mã sản phẩm hợp lệ đã có trong hệ thống (Ví dụ: MILK-VNM-180)',
    });
    guideSheet.addRow({
      column: 'SaleDate',
      required: 'BẮT BUỘC',
      dataType: 'Ngày (YYYY-MM-DD)',
      rule: 'Ngày bán hàng hợp lệ, không được vượt quá ngày hiện tại (Ví dụ: 2026-09-01)',
    });
    guideSheet.addRow({
      column: 'QuantitySold',
      required: 'BẮT BUỘC',
      dataType: 'Số nguyên (Integer)',
      rule: 'Số lượng bán ra trong ngày, phải là số nguyên >= 0 (Ví dụ: 24)',
    });
    guideSheet.addRow({
      column: 'UnitPrice',
      required: 'TÙY CHỌN',
      dataType: 'Số nguyên (Integer)',
      rule: 'Đơn giá bán thực tế. Nếu để trống, hệ thống tự động lấy giá bán niêm yết (Ví dụ: 6200)',
    });

    this.styleGuideRows(guideSheet);
  }

  private buildInventorySnapshotWorkbook(workbook: ExcelJS.Workbook): void {
    // 1. Main Data Sheet
    const sheet = workbook.addWorksheet('InventorySnapshots', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 22 },
      { header: 'OnHand', key: 'onHand', width: 18 },
    ];

    this.styleHeaderRow(sheet);

    // Sample data rows
    sheet.addRow({ sku: 'MILK-VNM-180', onHand: 120 });
    sheet.addRow({ sku: 'BEER-TIGER-330', onHand: 85 });
    sheet.addRow({ sku: 'NOODLE-HAOHAO-75', onHand: 200 });

    this.styleDataRows(sheet, [
      { col: 1, alignment: { horizontal: 'left' } },
      { col: 2, alignment: { horizontal: 'right' }, numFmt: '#,##0' },
    ]);

    // 2. Guide / Instruction Sheet
    const guideSheet = workbook.addWorksheet('Huong_Dan', {
      views: [{ showGridLines: true }],
    });

    guideSheet.columns = [
      { header: 'Tên Cột (Header)', key: 'column', width: 20 },
      { header: 'Bắt Buộc?', key: 'required', width: 15 },
      { header: 'Kiểu Dữ Liệu', key: 'dataType', width: 20 },
      { header: 'Quy Tắc Nghiệp Vụ & Ví Dụ (BR-001, BR-010)', key: 'rule', width: 55 },
    ];

    this.styleHeaderRow(guideSheet);

    guideSheet.addRow({
      column: 'SKU',
      required: 'BẮT BUỘC',
      dataType: 'Chuỗi văn bản (Text)',
      rule: 'Mã sản phẩm hợp lệ đã có trong hệ thống (Ví dụ: MILK-VNM-180)',
    });
    guideSheet.addRow({
      column: 'OnHand',
      required: 'BẮT BUỘC',
      dataType: 'Số nguyên (Integer)',
      rule: 'Số lượng tồn kho thực tế kiểm kê trên kệ, phải là số nguyên >= 0 (Ví dụ: 120)',
    });

    this.styleGuideRows(guideSheet);
  }

  private styleHeaderRow(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate-800 brand navy
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });
  }

  private styleDataRows(
    sheet: ExcelJS.Worksheet,
    columnStyles: Array<{ col: number; alignment: Partial<ExcelJS.Alignment>; numFmt?: string }>
  ): void {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 22;
      row.font = { name: 'Calibri', size: 11 };

      columnStyles.forEach(({ col, alignment, numFmt }) => {
        const cell = row.getCell(col);
        cell.alignment = { vertical: 'middle', ...alignment };
        if (numFmt) cell.numFmt = numFmt;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });
  }

  private styleGuideRows(guideSheet: ExcelJS.Worksheet): void {
    guideSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 24;
      row.font = { name: 'Calibri', size: 11 };

      const isRequired = row.getCell(2).text === 'BẮT BUỘC';
      if (isRequired) {
        row.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFDC2626' } }; // Rose red
      } else {
        row.getCell(2).font = { name: 'Calibri', size: 11, color: { argb: 'FF475569' } };
      }

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });
  }
}
