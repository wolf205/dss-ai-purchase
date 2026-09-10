import { Request, Response } from 'express';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class UserController {
  constructor(private readonly manageUserUseCase: ManageUserUseCase) {}

  public listUsers = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, isActive, role, search } = req.query as any;

    const result = await this.manageUserUseCase.list.execute({
      page,
      limit,
      isActive,
      role,
      search,
    });

    res.status(200).json({
      success: true,
      data: result.users,
      meta: buildPaginationMeta(page ?? 1, limit ?? 20, result.total),
      timestamp: new Date().toISOString(),
    });
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const user = await this.manageUserUseCase.create.execute(req.body, operatorUserId);
    res.status(201).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.getUserById.execute(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const user = await this.manageUserUseCase.update.execute(req.params.id, req.body, operatorUserId);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const user = await this.manageUserUseCase.setStatus(req.params.id, req.body.isActive, operatorUserId);
    res.status(200).json({
      success: true,
      data: {
        ...user,
        message: user.isActive ? 'Đã kích hoạt tài khoản thành công.' : 'Đã vô hiệu hóa tài khoản thành công.',
      },
      timestamp: new Date().toISOString(),
    });
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    const operatorUserId = req.user?.userId;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const result = await this.manageUserUseCase.resetPassword.execute(req.params.id, req.body, operatorUserId, ipAddress);
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };
}
