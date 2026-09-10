import { ApplicationException } from './ApplicationException';

export class TooManyRequestsException extends ApplicationException {
  constructor(
    message: string = 'Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau 15 phút.',
    code: string = 'TOO_MANY_REQUESTS'
  ) {
    super(message, code);
  }
}
