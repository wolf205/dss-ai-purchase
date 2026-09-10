import ExcelJS from 'exceljs';
import {
  IFileParser,
  FileParseResult,
  ParsedSalesHistoryRow,
  ParsedInventoryRow,
  FileParseError,
} from '../../application/ports/IFileParser';

export class ExcelFileParser implements IFileParser {
  public async parseSalesAndInventoryFile(
    buffer: Buffer,
    originalFilename: string,
    importType?: 'SALES_HISTORY' | 'INVENTORY_SNAPSHOT'
  ): Promise<FileParseResult> {
    const workbook = new ExcelJS.Workbook();
    const salesRows: ParsedSalesHistoryRow[] = [];
    const inventoryRows: ParsedInventoryRow[] = [];
    const errors: FileParseError[] = [];

    const isCsv = originalFilename.toLowerCase().endsWith('.csv');
    try {
      if (isCsv) {
        await workbook.csv.read(buffer as any);
      } else {
        await workbook.xlsx.load(buffer as any);
      }
    } catch (err: any) {
      errors.push({
        rowNumber: 1,
        field: 'file',
        message: 'Tệp tin Excel/CSV bị hỏng hoặc không đúng định dạng chuẩn.',
      });
      return { salesRows, inventoryRows, errors };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (workbook.worksheets.length === 0) {
      errors.push({
        rowNumber: 1,
        field: 'file',
        message: 'Tệp tin không chứa bất kỳ bảng tính (worksheet) nào.',
      });
      return { salesRows, inventoryRows, errors };
    }

    // Determine target sheets based on importType and content
    if (importType === 'INVENTORY_SNAPSHOT') {
      const targetSheet =
        workbook.getWorksheet('InventorySnapshots') ||
        workbook.getWorksheet('inventory_snapshots') ||
        workbook.getWorksheet('Inventory') ||
        workbook.getWorksheet('inventory') ||
        workbook.worksheets[0];

      this.parseInventorySheet(targetSheet, inventoryRows, errors);
      return { salesRows, inventoryRows, errors };
    }

    if (importType === 'SALES_HISTORY') {
      const targetSheet =
        workbook.getWorksheet('SalesHistory') ||
        workbook.getWorksheet('sales_history') ||
        workbook.getWorksheet('Sales') ||
        workbook.getWorksheet('sales') ||
        workbook.worksheets[0];

      this.parseSalesSheet(targetSheet, salesRows, errors, today);
      return { salesRows, inventoryRows, errors };
    }

    // Auto mode: check first sheet's headers to see if it's Inventory or Sales
    const firstSheet = workbook.worksheets[0];
    const firstSheetHeaders = this.extractHeaderMap(firstSheet);
    const hasInventoryHeader =
      firstSheetHeaders.has('onhand') ||
      firstSheetHeaders.has('tonkho') ||
      firstSheetHeaders.has('tonkhothucte') ||
      firstSheetHeaders.has('soluongton');
    const hasSalesHeader =
      firstSheetHeaders.has('saledate') ||
      firstSheetHeaders.has('ngayban') ||
      firstSheetHeaders.has('quantitysold') ||
      firstSheetHeaders.has('soluongban');

    if (hasInventoryHeader && !hasSalesHeader) {
      this.parseInventorySheet(firstSheet, inventoryRows, errors);
    } else {
      this.parseSalesSheet(firstSheet, salesRows, errors, today);

      // Check second sheet for Inventory if multi-sheet Excel
      if (!isCsv && workbook.worksheets.length > 1) {
        const secondSheet =
          workbook.getWorksheet('InventorySnapshots') ||
          workbook.getWorksheet('inventory_snapshots') ||
          workbook.getWorksheet('Inventory') ||
          workbook.getWorksheet('inventory') ||
          workbook.worksheets[1];

        if (secondSheet && secondSheet !== firstSheet) {
          this.parseInventorySheet(secondSheet, inventoryRows, errors);
        }
      }
    }

    return {
      salesRows,
      inventoryRows,
      errors,
    };
  }

  private extractHeaderMap(sheet: ExcelJS.Worksheet): Map<string, number> {
    const headerMap = new Map<string, number>();
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const headerName = this.normalizeHeader(cell.text);
      if (headerName) {
        headerMap.set(headerName, colNumber);
      }
    });
    return headerMap;
  }

  private parseSalesSheet(
    sheet: ExcelJS.Worksheet,
    salesRows: ParsedSalesHistoryRow[],
    errors: FileParseError[],
    today: Date
  ): void {
    const headerMap = this.extractHeaderMap(sheet);

    const skuCol =
      headerMap.get('sku') ||
      headerMap.get('productsku') ||
      headerMap.get('masku') ||
      headerMap.get('masanpham') ||
      headerMap.get('mahang');
    const dateCol =
      headerMap.get('saledate') ||
      headerMap.get('date') ||
      headerMap.get('ngayban') ||
      headerMap.get('ngay');

    if (!skuCol || !dateCol) {
      errors.push({
        rowNumber: 1,
        field: 'header',
        message: 'Bảng tính thiếu các cột bắt buộc: "Mã SKU" (SKU) hoặc "Ngày bán" (Date / SaleDate) tại hàng tiêu đề.',
      });
      return;
    }

    const qtyCol =
      headerMap.get('quantitysold') ||
      headerMap.get('quantity') ||
      headerMap.get('soluong') ||
      headerMap.get('soluongban') ||
      3;
    const priceCol =
      headerMap.get('unitsellingprice') ||
      headerMap.get('unitprice') ||
      headerMap.get('price') ||
      headerMap.get('dongia') ||
      headerMap.get('giaban') ||
      4;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rawSku = row.getCell(skuCol).text?.trim();
      const rawDate = row.getCell(dateCol).value;
      const rawQty = row.getCell(qtyCol).value;
      const rawPrice = row.getCell(priceCol).value;

      // Skip completely empty rows
      if (!rawSku && (rawDate === null || rawDate === undefined) && (rawQty === null || rawQty === undefined)) return;

      if (!rawSku) {
        errors.push({
          rowNumber,
          field: 'sku',
          message: `Mã SKU không được để trống tại dòng ${rowNumber}`,
          value: rawSku,
        });
        return;
      }

      const saleDate = this.parseDate(rawDate);
      if (!saleDate || isNaN(saleDate.getTime())) {
        errors.push({
          rowNumber,
          field: 'sale_date',
          message: `Ngày bán không hợp lệ tại dòng ${rowNumber}`,
          value: rawDate,
        });
      } else if (saleDate > today) {
        errors.push({
          rowNumber,
          field: 'sale_date',
          message: `Ngày bán không được vượt quá ngày hiện tại (BR-009) tại dòng ${rowNumber}`,
          value: rawDate,
        });
      }

      const qty = Number(rawQty);
      if (isNaN(qty) || qty < 0) {
        errors.push({
          rowNumber,
          field: 'quantity_sold',
          message: `Số lượng bán phải là số nguyên không âm (BR-009) tại dòng ${rowNumber}`,
          value: rawQty,
        });
      }

      const price = rawPrice !== null && rawPrice !== undefined && rawPrice !== '' ? Number(rawPrice) : 0;
      if (isNaN(price) || price < 0) {
        errors.push({
          rowNumber,
          field: 'unit_selling_price',
          message: `Đơn giá bán không được là số âm tại dòng ${rowNumber}`,
          value: rawPrice,
        });
      }

      if (saleDate && qty >= 0 && price >= 0 && saleDate <= today) {
        salesRows.push({
          sku: rawSku.toUpperCase(),
          saleDate,
          quantitySold: Math.floor(qty),
          unitSellingPrice: price,
          rowNumber,
        });
      }
    });
  }

  private parseInventorySheet(
    sheet: ExcelJS.Worksheet,
    inventoryRows: ParsedInventoryRow[],
    errors: FileParseError[]
  ): void {
    const headerMap = this.extractHeaderMap(sheet);

    const skuCol =
      headerMap.get('sku') ||
      headerMap.get('productsku') ||
      headerMap.get('masku') ||
      headerMap.get('masanpham') ||
      headerMap.get('mahang');
    const onHandCol =
      headerMap.get('onhand') ||
      headerMap.get('quantity') ||
      headerMap.get('tonkho') ||
      headerMap.get('tonkhothucte') ||
      headerMap.get('soluongton');

    if (!skuCol || !onHandCol) {
      errors.push({
        rowNumber: 1,
        field: 'header',
        message: 'Bảng tính thiếu các cột bắt buộc: "Mã SKU" (SKU) hoặc "Tồn kho thực tế" (OnHand / TonKho) tại hàng tiêu đề.',
      });
      return;
    }

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rawSku = row.getCell(skuCol).text?.trim();
      const rawOnHand = row.getCell(onHandCol).value;

      if (!rawSku && (rawOnHand === null || rawOnHand === undefined)) return;

      if (!rawSku) {
        errors.push({
          rowNumber,
          field: 'sku',
          message: `Mã SKU tồn kho không được để trống tại dòng ${rowNumber}`,
          value: rawSku,
        });
        return;
      }

      const onHand = Number(rawOnHand);
      if (isNaN(onHand) || onHand < 0) {
        errors.push({
          rowNumber,
          field: 'on_hand',
          message: `Số lượng tồn kho thực tế (On-Hand) phải là số nguyên không âm tại dòng ${rowNumber}`,
          value: rawOnHand,
        });
      } else {
        inventoryRows.push({
          sku: rawSku.toUpperCase(),
          onHand: Math.floor(onHand),
          rowNumber,
        });
      }
    });
  }

  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .trim()
      .replace(/[\s_-]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      return date;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
}
