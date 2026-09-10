import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserResponseDTO } from '../../dtos/AuthDTO';

export interface ListUsersDTO {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface ListUsersResult {
  users: UserResponseDTO[];
  total: number;
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(dto?: ListUsersDTO): Promise<ListUsersResult> {
    const page = Math.max(1, dto?.page ?? 1);
    const limit = Math.max(1, Math.min(100, dto?.limit ?? 20));
    const offset = (page - 1) * limit;

    const result = await this.userRepository.findAll({
      isActive: dto?.isActive,
      role: dto?.role,
      search: dto?.search,
      limit,
      offset,
    });

    return {
      users: result.users.map((u) => ({
        id: u.id || '',
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total: result.total,
    };
  }
}
