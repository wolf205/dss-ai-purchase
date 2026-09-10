import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserMeResponseDTO } from '../../dtos/AuthDTO';
import { UnauthorizedException, ForbiddenException } from '../../exceptions';

/**
 * UseCase: UC-015 / FR-031 - Get current user profile (Session Revalidation & Identity Sync).
 * Enforces BR-021: Deactivated accounts (isActive = false) are immediately blocked with ACCOUNT_LOCKED (403).
 * If user does not exist, throws UNAUTHORIZED (401) to trigger client-side session cleanup and redirect.
 */
export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string): Promise<UserMeResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        'UNAUTHORIZED'
      );
    }

    // Kiểm tra quy tắc bất biến BR-021: Tài khoản bị khóa không được phép sử dụng hệ thống
    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống để được hỗ trợ.',
        'ACCOUNT_LOCKED'
      );
    }

    return {
      id: user.id || '',
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
