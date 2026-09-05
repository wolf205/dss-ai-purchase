import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from '../../infrastructure/security/BcryptPasswordHasher';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService';

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

const loginUseCase = new LoginUseCase(userRepository, passwordHasher, tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenService);

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUseCase.execute(req.body);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refreshTokenUseCase.execute(req.body);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Không tìm thấy thông tin người dùng' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { message: 'Đăng xuất thành công' },
      timestamp: new Date().toISOString(),
    });
  }
}
