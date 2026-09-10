import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/auth/ChangePasswordUseCase';
import { GetProfileUseCase } from '../../application/use-cases/auth/GetProfileUseCase';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { UnauthorizedException } from '../../application/exceptions';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUseCase.execute({
      ...req.body,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    const result = await this.refreshTokenUseCase.execute({
      refreshToken: req.body.refreshToken,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        'UNAUTHORIZED'
      );
    }

    const profile = await this.getProfileUseCase.execute(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    });
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        'UNAUTHORIZED'
      );
    }

    const authHeader = req.headers.authorization;
    const token = req.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : '');

    const result = await this.changePasswordUseCase.execute({
      userId: req.user.userId,
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword,
      token,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = req.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : '');
    const refreshToken = req.body?.refreshToken;

    const result = await this.logoutUseCase.execute(token, refreshToken);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };
}


