import { JwtTokenService } from '../../../src/infrastructure/security/JwtTokenService';
import { UnauthorizedException } from '../../../src/application/exceptions/UnauthorizedException';
import jwt from 'jsonwebtoken';

describe('JwtTokenService', () => {
  let tokenService: JwtTokenService;
  const secret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';

  beforeEach(() => {
    tokenService = new JwtTokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token and return standard expiresIn (900s / 15m)', () => {
      const payload = {
        userId: 'u-123',
        username: 'purchaser1',
        role: 'STAFF',
      };

      const result = tokenService.generateAccessToken(payload);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.expiresIn).toBe(900);

      const decoded = jwt.verify(result.accessToken, secret) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken & hashToken', () => {
    it('should generate a 64-character hex random string for refresh token', () => {
      const token1 = tokenService.generateRefreshToken();
      const token2 = tokenService.generateRefreshToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should correctly produce a deterministic SHA-256 hash of token', () => {
      const rawToken = 'my-secret-random-token-string';
      const hash1 = tokenService.hashToken(rawToken);
      const hash2 = tokenService.hashToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });


  describe('verifyAccessToken', () => {
    it('should successfully verify and decode a valid token', () => {
      const payload = {
        userId: 'u-456',
        username: 'manager_kim',
        role: 'ADMIN',
      };

      const { accessToken } = tokenService.generateAccessToken(payload);
      const decoded = tokenService.verifyAccessToken(accessToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
    });

    it('should throw UnauthorizedException with TOKEN_EXPIRED when token has expired', () => {
      const expiredToken = jwt.sign(
        { userId: 'u-expired', username: 'expired_user', role: 'STAFF' },
        secret,
        { expiresIn: '-1s' }
      );

      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow(UnauthorizedException);

      try {
        tokenService.verifyAccessToken(expiredToken);
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.code).toBe('TOKEN_EXPIRED');
        expect(error.message).toBe('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        expect(error.details).toBeDefined();
      }
    });

    it('should throw UnauthorizedException with TOKEN_INVALID when token has invalid signature', () => {
      const invalidToken = jwt.sign(
        { userId: 'u-hacker', username: 'hacker', role: 'ADMIN' },
        'wrong_secret_key_123',
        { expiresIn: '1h' }
      );

      expect(() => tokenService.verifyAccessToken(invalidToken)).toThrow(UnauthorizedException);

      try {
        tokenService.verifyAccessToken(invalidToken);
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.code).toBe('TOKEN_INVALID');
        expect(error.message).toBe('Token xác thực không hợp lệ hoặc sai chữ ký.');
      }
    });

    it('should throw UnauthorizedException with TOKEN_INVALID when token string is malformed', () => {
      expect(() => tokenService.verifyAccessToken('not-a-valid-jwt-token')).toThrow(UnauthorizedException);

      try {
        tokenService.verifyAccessToken('not-a-valid-jwt-token');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.code).toBe('TOKEN_INVALID');
      }
    });
  });
});
