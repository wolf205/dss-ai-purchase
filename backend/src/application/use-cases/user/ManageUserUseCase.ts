import { CreateUserUseCase } from './CreateUserUseCase';
import { UpdateUserUseCase } from './UpdateUserUseCase';
import { ListUsersUseCase } from './ListUsersUseCase';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { UserResponseDTO } from '../../dtos/AuthDTO';
import { EntityNotFoundException } from '../../exceptions';

export class ManageUserUseCase {
  public readonly create: CreateUserUseCase;
  public readonly update: UpdateUserUseCase;
  public readonly list: ListUsersUseCase;

  constructor(
    private readonly userRepository: IUserRepository,
    passwordHasher: IPasswordHasher
  ) {
    this.create = new CreateUserUseCase(userRepository, passwordHasher);
    this.update = new UpdateUserUseCase(userRepository, passwordHasher);
    this.list = new ListUsersUseCase(userRepository);
  }

  public async getById(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', userId);
    }
    return {
      id: user.id || '',
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async toggleActive(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', userId);
    }
    user.setActiveStatus(!user.isActive);
    const updated = await this.userRepository.update(user);
    return {
      id: updated.id || '',
      username: updated.username,
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
      mustChangePassword: updated.mustChangePassword,
      lastLoginAt: updated.lastLoginAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
