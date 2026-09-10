import crypto from 'crypto';
import jwt, { SignOptions, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { ITokenService, TokenPayload, AccessTokenResult } from '../../application/ports/ITokenService';
import { UnauthorizedException } from '../../application/exceptions/UnauthorizedException';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  }

  public generateAccessToken(payload: TokenPayload): AccessTokenResult {
    const accessOptions: SignOptions = {
      expiresIn: this.accessExpiresIn as any,
    };

    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      },
      this.accessSecret,
      accessOptions
    );

    return {
      accessToken,
      expiresIn: 900, // 15 minutes in seconds (Short-lived Access Token)
    };
  }

  public generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }


  public verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as any;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat,
      };
    } catch (error: any) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
          'TOKEN_EXPIRED',
          { expiredAt: error.expiredAt }
        );
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          'Token xác thực không hợp lệ hoặc sai chữ ký.',
          'TOKEN_INVALID'
        );
      }
      throw new UnauthorizedException(
        'Xác thực quyền truy cập thất bại.',
        'UNAUTHORIZED',
        error.message
      );
    }
  }
}

