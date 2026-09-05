import { Request, Response, NextFunction } from 'express';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from '../../infrastructure/security/BcryptPasswordHasher';

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const manageUserUseCase = new ManageUserUseCase(userRepository, passwordHasher);

export class UserController {
  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const role = req.query.role as string | undefined;
      const users = await manageUserUseCase.list.execute({ isActive, role });

      res.status(200).json({
        success: true,
        data: users,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await manageUserUseCase.create.execute(req.body);
      res.status(201).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await manageUserUseCase.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await manageUserUseCase.update.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await manageUserUseCase.toggleActive(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
