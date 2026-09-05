import { ApplicationException } from './ApplicationException';

export class EntityNotFoundException extends ApplicationException {
  constructor(entityName: string, identifier: string | number, details?: any) {
    super(
      `Không tìm thấy ${entityName} với mã/ID: ${identifier}`,
      'RESOURCE_NOT_FOUND',
      details
    );
  }
}
