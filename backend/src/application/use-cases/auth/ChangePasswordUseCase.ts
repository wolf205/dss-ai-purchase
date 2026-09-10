import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { ValidationException, UnauthorizedException, ForbiddenException } from '../../exceptions';

export interface ChangePasswordDTO {
  userId: string;
  oldPassword: string;
  newPassword: string;
  token?: string;
}

/**
 * UseCase: UC-015 Flow A1, A2 / FR-031 - Change user password.
 * Enforces:
 * 1. Password constraints: >= 8 characters and distinct from current password.
 * 2. Invariant BR-021: Deactivated accounts (isActive = false) cannot change password (403 ACCOUNT_LOCKED).
 * 3. Identity check: Non-existent users throw UNAUTHORIZED (401).
 * 4. Token revocation: Upon successful password change, revokes current session token via ITokenBlacklistService
 *    and revokes all active Refresh Tokens in database via IRefreshTokenRepository.
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenBlacklistService?: ITokenBlacklistService,
    private readonly refreshTokenRepository?: IRefreshTokenRepository
  ) {}


  public async execute(dto: ChangePasswordDTO): Promise<{ message: string }> {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new ValidationException('Mật khẩu hiện tại và mật khẩu mới không được để trống');
    }

    if (dto.newPassword.length < 8) {
      throw new ValidationException('Mật khẩu mới phải có ít nhất 8 ký tự');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new ValidationException('Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        'UNAUTHORIZED'
      );
    }

    // Kiểm tra quy tắc bất biến BR-021: Tài khoản bị khóa không được phép thao tác
    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống để được hỗ trợ.',
        'ACCOUNT_LOCKED'
      );
    }

    const isOldPasswordValid = await this.passwordHasher.compare(dto.oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác.', 'INVALID_CREDENTIALS');
    }

    const newPasswordHash = await this.passwordHasher.hash(dto.newPassword);
    user.updatePassword(newPasswordHash);
    await this.userRepository.update(user);

    // 1. Thu hồi toàn bộ các phiên làm việc cũ trong RAM Blacklist tức thời
    if (this.tokenBlacklistService) {
      if (this.tokenBlacklistService.revokeUserTokensBefore) {
        await this.tokenBlacklistService.revokeUserTokensBefore(dto.userId);
      }
      if (dto.token) {
        await this.tokenBlacklistService.revoke(dto.token, 900);
      }
    }

    // 2. Thu hồi toàn bộ Refresh Token của tài khoản trong CSDL
    if (this.refreshTokenRepository) {
      await this.refreshTokenRepository.revokeAllForUser(dto.userId);
    }

    return {
      message: 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.',
    };
  }
}

