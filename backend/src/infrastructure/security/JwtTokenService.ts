import jwt, { SignOptions } from 'jsonwebtoken';
import { ITokenService, TokenPair, TokenPayload } from '../../application/ports/ITokenService';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'dss_refresh_secret_key_default_2026';
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  public generateTokenPair(payload: TokenPayload): TokenPair {
    const accessOptions: SignOptions = {
      expiresIn: this.accessExpiresIn as any,
    };
    const refreshOptions: SignOptions = {
      expiresIn: this.refreshExpiresIn as any,
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

    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      },
      this.refreshSecret,
      refreshOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  public verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as TokenPayload;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error: any) {
      throw new Error(`Token không hợp lệ hoặc đã hết hạn: ${error.message}`);
    }
  }

  public verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as TokenPayload;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error: any) {
      throw new Error(`Refresh token không hợp lệ hoặc đã hết hạn: ${error.message}`);
    }
  }
}
