import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { UpdateUserRequestDTO, UserResponseDTO } from '../../dtos/AuthDTO';
import { EntityNotFoundException, DuplicateResourceException } from '../../exceptions';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  public async execute(userId: string, dto: UpdateUserRequestDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', userId);
    }

    if (dto.fullName !== undefined || dto.email !== undefined) {
      const newFullName = dto.fullName !== undefined ? dto.fullName : user.fullName;
      const newEmail = dto.email !== undefined ? dto.email.toLowerCase() : user.email;

      if (dto.email && dto.email.toLowerCase() !== user.email) {
        const existingEmail = await this.userRepository.findByEmail(dto.email.toLowerCase());
        if (existingEmail && existingEmail.id !== user.id) {
          throw new DuplicateResourceException('Email', dto.email);
        }
      }

      user.updateProfile(newFullName, newEmail);
    }

    if (dto.role !== undefined) {
      user.updateRole(dto.role);
    }

    if (dto.isActive !== undefined) {
      user.setActiveStatus(dto.isActive);
    }

    if (dto.password) {
      const newHash = await this.passwordHasher.hash(dto.password);
      user.updatePassword(newHash);
    }

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
