export interface SalesHistoryProps {
  id?: string;
  productSku: string;
  saleDate: Date;
  quantitySold: number;
  revenue: number;
  source?: string;
  importBatchId?: string | null;
  createdAt?: Date;
}

export class SalesHistory {
  public readonly id?: string;
  public readonly productSku: string;
  public readonly saleDate: Date;
  public readonly quantitySold: number;
  public readonly revenue: number;
  public readonly source: string;
  public readonly importBatchId?: string | null;
  public readonly createdAt: Date;

  constructor(props: SalesHistoryProps) {
    if (!props.productSku || !props.productSku.trim()) {
      throw new Error('Mã SKU không được để trống');
    }
    if (props.quantitySold < 0) {
      throw new Error('Số lượng bán không được là số âm (BR-009)');
    }
    if (props.revenue < 0) {
      throw new Error('Doanh thu bán hàng không được là số âm');
    }

    this.id = props.id;
    this.productSku = props.productSku.trim().toUpperCase();
    this.saleDate = props.saleDate;
    this.quantitySold = Math.floor(props.quantitySold);
    this.revenue = Math.round(props.revenue * 100) / 100;
    this.source = props.source ?? 'IMPORT_EXCEL';
    this.importBatchId = props.importBatchId;
    this.createdAt = props.createdAt ?? new Date();
  }

  public get unitSellingPrice(): number {
    if (this.quantitySold <= 0) return 0;
    return Math.round((this.revenue / this.quantitySold) * 100) / 100;
  }
}
