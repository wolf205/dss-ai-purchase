import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { UpdateUserRequestDTO, UserResponseDTO } from '../../dtos/AuthDTO';
import { EntityNotFoundException, DuplicateResourceException } from '../../exceptions';
import { DomainException } from '../../../domain/exceptions/DomainException';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  public async execute(
    userId: string,
    dto: UpdateUserRequestDTO,
    operatorUserId?: string
  ): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', userId);
    }

    // 1. Kiểm tra ràng buộc an toàn khi hạ quyền ADMIN xuống STAFF (UC-016 Luồng E3, E4)
    if (dto.role !== undefined && dto.role === 'STAFF' && user.role === 'ADMIN') {
      if (operatorUserId && operatorUserId === userId) {
        throw new DomainException(
          'Không thể tự hạ quyền quản trị của chính bạn',
          'BUSINESS_RULE_VIOLATION'
        );
      }

      const { total: activeAdminCount } = await this.userRepository.findAll({ isActive: true, role: 'ADMIN' });
      if (activeAdminCount <= 1) {
        throw new DomainException(
          'Không thể hạ quyền tài khoản này vì đây là tài khoản Quản trị viên duy nhất đang hoạt động trong hệ thống',
          'BUSINESS_RULE_VIOLATION'
        );
      }
    }

    // 2. Kiểm tra ràng buộc an toàn khi khóa tài khoản ADMIN (UC-016 Luồng E3, E4)
    if (dto.isActive !== undefined && dto.isActive === false && user.isActive && user.role === 'ADMIN') {
      if (operatorUserId && operatorUserId === userId) {
        throw new DomainException(
          'Không thể tự khóa tài khoản quản trị của chính bạn',
          'BUSINESS_RULE_VIOLATION'
        );
      }

      const { total: activeAdminCount } = await this.userRepository.findAll({ isActive: true, role: 'ADMIN' });
      if (activeAdminCount <= 1) {
        throw new DomainException(
          'Không thể khóa tài khoản này vì đây là tài khoản Quản trị viên duy nhất đang hoạt động trong hệ thống',
          'BUSINESS_RULE_VIOLATION'
        );
      }
    }

    if (dto.fullName !== undefined || dto.email !== undefined) {
      const newFullName = dto.fullName !== undefined ? dto.fullName : user.fullName;
      const normalizedEmail = dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
      const newEmail = normalizedEmail ?? user.email;

      if (normalizedEmail && normalizedEmail !== user.email.toLowerCase()) {
        const existingEmail = await this.userRepository.findByEmail(normalizedEmail);
        if (existingEmail && existingEmail.id !== user.id) {
          throw new DuplicateResourceException('Email', normalizedEmail);
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

