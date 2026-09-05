export interface ParsedSalesHistoryRow {
  sku: string;
  saleDate: Date;
  quantitySold: number;
  unitSellingPrice: number;
  rowNumber: number;
}

export interface ParsedInventoryRow {
  sku: string;
  onHand: number;
  rowNumber: number;
}

export interface FileParseError {
  rowNumber: number;
  field: string;
  message: string;
  value?: any;
}

export interface FileParseResult {
  salesRows: ParsedSalesHistoryRow[];
  inventoryRows: ParsedInventoryRow[];
  errors: FileParseError[];
}

export interface IFileParser {
  parseSalesAndInventoryFile(buffer: Buffer, originalFilename: string): Promise<FileParseResult>;
}
