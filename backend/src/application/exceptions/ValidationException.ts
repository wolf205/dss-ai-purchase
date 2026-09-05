import { ApplicationException } from './ApplicationException';

export class ValidationException extends ApplicationException {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}
