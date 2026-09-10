export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
}

export interface AccessTokenResult {
  accessToken: string;
  expiresIn: number; // in seconds (900s for 15m default, or custom)
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): AccessTokenResult;
  generateRefreshToken(): string;
  hashToken(token: string): string;
  verifyAccessToken(token: string): TokenPayload;
}



