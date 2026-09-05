import { DomainException } from './DomainException';

export class InvalidOrderStateException extends DomainException {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_STATE_TRANSITION', details);
  }
}
