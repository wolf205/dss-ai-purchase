import { Request, Response, NextFunction } from 'express';
import { tokenService, tokenBlacklistService } from '../../infrastructure/di/container';
import { UnauthorizedException } from '../../application/exceptions/UnauthorizedException';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedException(
        'Yêu cầu Bearer Token xác thực để truy cập API này',
        'UNAUTHORIZED'
      )
    );
  }

  const token = authHeader.split(' ')[1];

  // 1. Kiểm tra Token Blacklist (đã thu hồi khi Logout)
  if (tokenBlacklistService && tokenBlacklistService.isRevoked(token)) {
    return next(
      new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        'UNAUTHORIZED'
      )
    );
  }

  // 2. Xác thực chữ ký và thời hạn Token
  try {
    const payload = tokenService.verifyAccessToken(token);

    // 3. Kiểm tra tài khoản người dùng đã bị khóa / thu hồi phiên truy cập (UC-016 A2.5, BR-021)
    if (tokenBlacklistService?.isUserRevoked && tokenBlacklistService.isUserRevoked(payload.userId)) {
      return next(
        new UnauthorizedException(
          'Tài khoản đã bị vô hiệu hóa hoặc phiên làm việc đã bị thu hồi. Vui lòng liên hệ Quản trị viên.',
          'ACCOUNT_LOCKED'
        )
      );
    }

    // 4. Kiểm tra token cấp trước thời điểm đổi mật khẩu / thu hồi toàn bộ phiên cũ
    if (
      tokenBlacklistService?.isTokenIssuedBeforeRevocation &&
      tokenBlacklistService.isTokenIssuedBeforeRevocation(payload.userId, payload.iat)
    ) {
      return next(
        new UnauthorizedException(
          'Mật khẩu tài khoản đã được thay đổi. Toàn bộ phiên làm việc cũ đã bị thu hồi. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED'
        )
      );
    }

    req.user = payload;
    req.token = token;
    return next();
  } catch (error: any) {
    return next(error);
  }
};

