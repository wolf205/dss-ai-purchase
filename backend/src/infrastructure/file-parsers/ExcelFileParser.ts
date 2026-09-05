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
    originalFilename: string
  ): Promise<FileParseResult> {
    const workbook = new ExcelJS.Workbook();
    const salesRows: ParsedSalesHistoryRow[] = [];
    const inventoryRows: ParsedInventoryRow[] = [];
    const errors: FileParseError[] = [];

    const isCsv = originalFilename.toLowerCase().endsWith('.csv');
    if (isCsv) {
      // Parse CSV as SalesHistory
      await workbook.csv.read(buffer as any);
    } else {
      await workbook.xlsx.load(buffer as any);
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // 1. Process SalesHistory Worksheet
    let salesSheet = workbook.getWorksheet('SalesHistory') || workbook.getWorksheet('sales_history') || workbook.getWorksheet('Sales');
    if (!salesSheet && !isCsv && workbook.worksheets.length > 0) {
      salesSheet = workbook.worksheets[0];
    }

    if (salesSheet) {
      const headerMap = new Map<string, number>();
      const headerRow = salesSheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const headerName = this.normalizeHeader(cell.text);
        headerMap.set(headerName, colNumber);
      });

      const skuCol = headerMap.get('sku') || headerMap.get('product_sku') || headerMap.get('masku') || 1;
      const dateCol = headerMap.get('sale_date') || headerMap.get('saledate') || headerMap.get('date') || headerMap.get('ngayban') || 2;
      const qtyCol = headerMap.get('quantity_sold') || headerMap.get('quantity') || headerMap.get('soluong') || headerMap.get('soluongban') || 3;
      const priceCol = headerMap.get('unit_selling_price') || headerMap.get('unit_price') || headerMap.get('price') || headerMap.get('dongia') || 4;

      salesSheet.eachRow((row, rowNumber) => {
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

    // 2. Process InventorySnapshots Worksheet (if exists and not CSV)
    if (!isCsv) {
      const inventorySheet =
        workbook.getWorksheet('InventorySnapshots') ||
        workbook.getWorksheet('inventory_snapshots') ||
        workbook.getWorksheet('Inventory') ||
        workbook.getWorksheet('inventory') ||
        (workbook.worksheets.length > 1 ? workbook.worksheets[1] : null);

      if (inventorySheet && inventorySheet !== salesSheet) {
        const headerMap = new Map<string, number>();
        const headerRow = inventorySheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          const headerName = this.normalizeHeader(cell.text);
          headerMap.set(headerName, colNumber);
        });

        const skuCol = headerMap.get('sku') || headerMap.get('product_sku') || headerMap.get('masku') || 1;
        const onHandCol = headerMap.get('on_hand') || headerMap.get('onhand') || headerMap.get('quantity') || headerMap.get('tonkho') || headerMap.get('tonkhothucte') || 2;

        inventorySheet.eachRow((row, rowNumber) => {
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
    }

    return {
      salesRows,
      inventoryRows,
      errors,
    };
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
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
}
