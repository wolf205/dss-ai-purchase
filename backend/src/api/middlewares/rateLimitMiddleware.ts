import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Layer 1 Defense: HTTP Router Flood / DDoS protection for login endpoint.
 * Limits rapid consecutive requests from a single IP to prevent server exhaustion.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true, // Return standard RateLimit headers (RFC 6585)
  legacyHeaders: false, // Disable X-RateLimit-* legacy headers
  validate: { xForwardedForHeader: false },
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment for automated test suites
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Layer 1 Defense: Rate Limiter for Change Password endpoint.
 * Protects against brute-forcing existing passwords or credential stuffing.
 */
export const changePasswordRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Max 10 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Quá nhiều yêu cầu đổi mật khẩu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Layer 1 Defense: Rate Limiter for Reset Password endpoint.
 * Protects against mass reset attacks or DoS on user accounts.
 * Max 10 requests per 15 minutes per IP.
 */
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 reset attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

