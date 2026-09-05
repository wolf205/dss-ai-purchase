import { ApplicationException } from './ApplicationException';

export class UnauthorizedException extends ApplicationException {
  constructor(
    message: string = 'Tài khoản hoặc mật khẩu không chính xác',
    code: string = 'INVALID_CREDENTIALS',
    details?: any
  ) {
    super(message, code, details);
  }
}
