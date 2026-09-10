import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../src/api/middlewares/authMiddleware';
import { tokenBlacklistService } from '../../../src/infrastructure/di/container';
import { UnauthorizedException } from '../../../src/application/exceptions/UnauthorizedException';
import jwt from 'jsonwebtoken';

describe('authMiddleware (Session & Revocation Verification)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    nextFunction = jest.fn();
    tokenBlacklistService.clear();
  });

  it('should pass UnauthorizedException to next() when Authorization header is missing', () => {
    mockReq.headers = {};

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu Bearer Token xác thực để truy cập API này',
      })
    );
    expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
  });

  it('should pass UnauthorizedException to next() when Authorization header does not start with Bearer', () => {
    mockReq.headers = { authorization: 'Basic 12345' };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu Bearer Token xác thực để truy cập API này',
      })
    );
  });

  it('should pass UnauthorizedException to next() when token has been revoked via Logout', () => {
    const revokedToken = 'revoked.jwt.token';
    tokenBlacklistService.revoke(revokedToken, 1000);

    mockReq.headers = { authorization: `Bearer ${revokedToken}` };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      })
    );
  });

  it('should pass ACCOUNT_LOCKED UnauthorizedException to next() when user account has been revoked via Admin lock (UC-016 A2.5, BR-021)', () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    const validToken = jwt.sign(
      { userId: 'locked-user-uuid', username: 'staff_locked', role: 'STAFF' },
      secret,
      { expiresIn: '1h' }
    );

    tokenBlacklistService.revokeUser('locked-user-uuid');

    mockReq.headers = { authorization: `Bearer ${validToken}` };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ACCOUNT_LOCKED',
        message: 'Tài khoản đã bị vô hiệu hóa hoặc phiên làm việc đã bị thu hồi. Vui lòng liên hệ Quản trị viên.',
      })
    );
  });

  it('should pass UnauthorizedException to next() when token was issued before password change timestamp', () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    // Token issued at current time minus 10 seconds
    const pastIat = Math.floor((Date.now() - 10000) / 1000);
    const validToken = jwt.sign(
      { userId: 'u-pw-change', username: 'staff01', role: 'STAFF', iat: pastIat },
      secret,
      { expiresIn: '1h' }
    );

    // Password was changed 5 seconds ago (after token was issued)
    tokenBlacklistService.revokeUserTokensBefore('u-pw-change', Date.now() - 5000);

    mockReq.headers = { authorization: `Bearer ${validToken}` };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Mật khẩu tài khoản đã được thay đổi'),
      })
    );
  });

  it('should pass TOKEN_INVALID UnauthorizedException to next() when token signature is malformed or invalid', () => {
    mockReq.headers = { authorization: 'Bearer invalid-token-string' };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TOKEN_INVALID',
        message: 'Token xác thực không hợp lệ hoặc sai chữ ký.',
      })
    );
  });

  it('should pass TOKEN_EXPIRED UnauthorizedException to next() when token has expired', () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    const expiredToken = jwt.sign(
      { userId: 'u-expired', username: 'user_expired', role: 'STAFF' },
      secret,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );

    mockReq.headers = { authorization: `Bearer ${expiredToken}` };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TOKEN_EXPIRED',
        message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
      })
    );
  });

  it('should call next() with no arguments and attach user and token when valid and unrevoked', () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'dss_access_secret_key_default_2026';
    const validToken = jwt.sign(
      { userId: 'u1', username: 'admin', role: 'ADMIN' },
      secret,
      { expiresIn: '1h' }
    );

    mockReq.headers = { authorization: `Bearer ${validToken}` };

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect(mockReq.user).toEqual(
      expect.objectContaining({
        userId: 'u1',
        username: 'admin',
        role: 'ADMIN',
      })
    );
    expect(mockReq.token).toBe(validToken);
  });
});

