import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService';

const tokenService = new JwtTokenService();

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu Bearer Token xác thực để truy cập API này',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID_OR_EXPIRED',
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }
};
