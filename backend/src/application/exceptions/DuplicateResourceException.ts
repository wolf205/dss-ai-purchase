import { ApplicationException } from './ApplicationException';

export class DuplicateResourceException extends ApplicationException {
  constructor(field: string, value: string | number, details?: any) {
    super(
      `Giá trị "${value}" của trường ${field} đã tồn tại trên hệ thống`,
      'DUPLICATE_RESOURCE',
      details
    );
  }
}
