import { DomainException } from './DomainException';

export class OutOfStockException extends DomainException {
  constructor(sku: string, details?: any) {
    super(`Sản phẩm ${sku} đã hết hàng trong kho`, 'OUT_OF_STOCK', details);
  }
}
