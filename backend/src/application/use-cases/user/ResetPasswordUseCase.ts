import crypto from 'crypto';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { ResetPasswordRequestDTO, ResetPasswordResponseDTO } from '../../dtos/AuthDTO';
import {
  EntityNotFoundException,
  ValidationException,
  ForbiddenException,
} from '../../exceptions';
import { DomainException } from '../../../domain/exceptions/DomainException';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenBlacklistService?: ITokenBlacklistService,
    private readonly refreshTokenRepository?: IRefreshTokenRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  public async execute(
    targetUserId: string,
    dto?: ResetPasswordRequestDTO,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<ResetPasswordResponseDTO> {
    // 1. Chặn Quản trị viên tự reset mật khẩu của chính mình (Self-Reset Protection)
    if (operatorUserId && operatorUserId === targetUserId) {
      throw new DomainException(
        'Không thể tự đặt lại mật khẩu cho tài khoản của chính bạn. Vui lòng sử dụng chức năng Đổi mật khẩu cá nhân.',
        'BUSINESS_RULE_VIOLATION'
      );
    }

    // 2. Tìm kiếm tài khoản người dùng
    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', targetUserId);
    }

    // 3. Kiểm tra quy tắc an toàn BR-021: Chặn reset mật khẩu tài khoản đang bị vô hiệu hóa
    if (!user.isActive) {
      throw new ForbiddenException(
        'Không thể đặt lại mật khẩu cho tài khoản đang bị khóa. Vui lòng kích hoạt lại tài khoản trước.',
        'ACCOUNT_LOCKED'
      );
    }

    // 4. Xác định mật khẩu tạm thời: Admin chỉ định hoặc hệ thống tự sinh mật mã an toàn (CSPRNG)
    let tempPassword = dto?.newPassword?.trim();
    if (tempPassword) {
      if (tempPassword.length < 8) {
        throw new ValidationException('Mật khẩu mới phải có ít nhất 8 ký tự');
      }
    } else {
      tempPassword = this.generateSecureRandomPassword(10);
    }

    // 5. Cập nhật mật khẩu băm và gán cờ mustChangePassword = true (UC-016 A4.4)
    const passwordHash = await this.passwordHasher.hash(tempPassword);
    user.resetPassword(passwordHash);
    const updated = await this.userRepository.update(user);

    // 6. Thu hồi toàn bộ các phiên làm việc cũ trong RAM tức thời
    this.tokenBlacklistService?.revokeUserTokensBefore?.(targetUserId);

    // 7. Thu hồi toàn bộ Refresh Token của tài khoản trong CSDL
    if (this.refreshTokenRepository) {
      await this.refreshTokenRepository.revokeAllForUser(targetUserId);
    }

    // 8. Ghi nhận Nhật Ký Kiểm Toán (Audit Log) cho thao tác nhạy cảm của Admin
    if (this.auditLogRepository) {
      await this.auditLogRepository.create({
        userId: operatorUserId,
        action: 'USER_PASSWORD_RESET',
        entityName: 'users',
        entityId: targetUserId,
        ipAddress,
      });
    }

    return {
      id: updated.id || '',
      username: updated.username,
      mustChangePassword: updated.mustChangePassword,
      temporaryPassword: tempPassword,
      message: `Đã đặt lại mật khẩu cho tài khoản ${updated.username} thành công. Vui lòng gửi mật khẩu tạm thời này cho nhân viên.`,
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    };
  }

  /**
   * Sinh mật khẩu ngẫu nhiên an toàn bằng Cryptographically Secure PRNG (CSPRNG)
   * Đảm bảo: >= 10 ký tự, có đủ chữ hoa, chữ thường, số, ký tự đặc biệt,
   * và loại bỏ các ký tự dễ gây nhầm lẫn thị giác (0, O, I, l, 1).
   */
  private generateSecureRandomPassword(length: number = 10): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Loại bỏ I, O
    const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // Loại bỏ l
    const numbers = '23456789';                   // Loại bỏ 0, 1
    const special = '!@#$%&*';

    // Đảm bảo luôn có tối thiểu 1 ký tự từ mỗi nhóm bắt buộc
    const chars: string[] = [
      uppercase[crypto.randomInt(0, uppercase.length)],
      lowercase[crypto.randomInt(0, lowercase.length)],
      numbers[crypto.randomInt(0, numbers.length)],
      special[crypto.randomInt(0, special.length)],
    ];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = chars.length; i < length; i++) {
      chars.push(allChars[crypto.randomInt(0, allChars.length)]);
    }

    // Xáo trộn chuỗi ngẫu nhiên bằng thuật toán Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }
}
