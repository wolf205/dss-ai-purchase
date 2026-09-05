import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserResponseDTO } from '../../dtos/AuthDTO';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(options?: { isActive?: boolean; role?: string }): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findAll(options);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }
}
