import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/auth/ChangePasswordUseCase';
import { GetProfileUseCase } from '../../application/use-cases/auth/GetProfileUseCase';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly changePasswordUseCase?: ChangePasswordUseCase
  ) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUseCase.execute(req.body);
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    const result = await this.refreshTokenUseCase.execute(req.body);
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
        timestamp: new Date().toISOString(),
      });
      return;
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
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!this.changePasswordUseCase) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Dịch vụ đổi mật khẩu chưa được khởi tạo' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await this.changePasswordUseCase.execute({
      userId: req.user.userId,
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  public logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: { message: 'Đăng xuất thành công' },
      timestamp: new Date().toISOString(),
    });
  };
}
