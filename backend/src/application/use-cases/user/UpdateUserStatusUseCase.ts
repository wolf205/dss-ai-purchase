import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { UserResponseDTO } from '../../dtos/AuthDTO';
import { EntityNotFoundException } from '../../exceptions';
import { DomainException } from '../../../domain/exceptions/DomainException';

export class UpdateUserStatusUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService?: ITokenBlacklistService,
    private readonly refreshTokenRepository?: IRefreshTokenRepository
  ) {}


  public async execute(
    userId: string,
    isActive: boolean,
    operatorUserId?: string
  ): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', userId);
    }

    // Tối ưu Idempotency: nếu trạng thái không thay đổi, trả về luôn không cần update DB
    if (user.isActive === isActive) {
      return this.toDTO(user);
    }

    // Kiểm tra ràng buộc an toàn khi khóa tài khoản ADMIN (UC-016 Luồng E3, E4)
    if (!isActive && user.isActive && user.role === 'ADMIN') {
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

    user.setActiveStatus(isActive);
    const updated = await this.userRepository.update(user);

    // Thu hồi hoặc khôi phục quyền truy cập tức thời tại Middleware (UC-016 A2.5, BR-021)
    if (!isActive) {
      this.tokenBlacklistService?.revokeUser?.(userId);
      if (this.refreshTokenRepository) {
        await this.refreshTokenRepository.revokeAllForUser(userId);
      }
    } else {
      this.tokenBlacklistService?.unrevokeUser?.(userId);
    }


    return this.toDTO(updated);
  }

  private toDTO(user: any): UserResponseDTO {
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
}
