import { TokenPayload } from '../application/ports/ITokenService';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
