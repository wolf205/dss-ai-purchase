import { Request, Response } from 'express';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';
import { buildPaginationMeta } from '../utils/pagination';

export class UserController {
  constructor(private readonly manageUserUseCase: ManageUserUseCase) {}

  public listUsers = async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    let users = await this.manageUserUseCase.list.execute({ isActive, role });

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    const total = users.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      data: paginatedUsers,
      meta: buildPaginationMeta(page, limit, total),
      timestamp: new Date().toISOString(),
    });
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.create.execute(req.body);
    res.status(201).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.getById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.update.execute(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.setStatus(req.params.id, req.body.isActive);
    res.status(200).json({
      success: true,
      data: {
        ...user,
        message: user.isActive ? 'Đã kích hoạt tài khoản thành công.' : 'Đã vô hiệu hóa tài khoản thành công.',
      },
      timestamp: new Date().toISOString(),
    });
  };

  public toggleActive = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.toggleActive(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };
}
