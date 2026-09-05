import { Request, Response } from 'express';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';

export class UserController {
  constructor(private readonly manageUserUseCase: ManageUserUseCase) {}

  public listUsers = async (req: Request, res: Response): Promise<void> => {
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const role = req.query.role as string | undefined;
    const users = await this.manageUserUseCase.list.execute({ isActive, role });

    res.status(200).json({
      success: true,
      data: users,
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

  public toggleActive = async (req: Request, res: Response): Promise<void> => {
    const user = await this.manageUserUseCase.toggleActive(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  };
}
