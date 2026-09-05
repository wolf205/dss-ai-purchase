import { DomainException } from './DomainException';

export class ValidationException extends DomainException {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}
