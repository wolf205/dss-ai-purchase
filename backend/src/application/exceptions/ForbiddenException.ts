import { ApplicationException } from './ApplicationException';

export class ForbiddenException extends ApplicationException {
  constructor(
    message: string = 'Bạn không có quyền thực hiện thao tác này',
    code: string = 'FORBIDDEN',
    details?: any
  ) {
    super(message, code, details);
  }
}
