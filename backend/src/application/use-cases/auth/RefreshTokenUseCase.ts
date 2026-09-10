import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../ports/ITokenService';
import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { RefreshTokenRequestDTO, RefreshTokenResponseDTO } from '../../dtos/AuthDTO';
import {
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
} from '../../exceptions';

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly tokenBlacklistService?: ITokenBlacklistService
  ) {}

  public async execute(dto: RefreshTokenRequestDTO): Promise<RefreshTokenResponseDTO> {
    if (!dto.refreshToken || !dto.refreshToken.trim()) {
      throw new ValidationException('Refresh Token không được để trống');
    }

    const rawToken = dto.refreshToken.trim();
    const tokenHash = this.tokenService.hashToken(rawToken);

    // 1. Tìm bản ghi Refresh Token trong CSDL
    const tokenEntity = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!tokenEntity) {
      throw new UnauthorizedException(
        'Phiên làm việc không hợp lệ hoặc không tồn tại. Vui lòng đăng nhập lại.',
        'REFRESH_TOKEN_INVALID'
      );
    }

    // 2. Cơ chế Phát Hiện Chiếm Đoạt Phiên (Token Theft Detection & Reuse)
    if (tokenEntity.revokedAt !== null) {
      if (tokenEntity.replacedByTokenHash) {
        // Token đã bị xoay vòng trước đó nhưng lại được gửi lên lại -> Có kẻ gian đánh cắp token!
        // Lập tức thu hồi toàn bộ Refresh Token của tài khoản để bảo vệ người dùng
        await this.refreshTokenRepository.revokeAllForUser(tokenEntity.userId);
        throw new UnauthorizedException(
          'Phát hiện dấu hiệu chiếm đoạt phiên làm việc. Toàn bộ phiên truy cập đã bị thu hồi vì lý do an toàn. Vui lòng đăng nhập lại.',
          'SESSION_REVOKED'
        );
      }

      throw new UnauthorizedException(
        'Phiên làm việc đã bị thu hồi hoặc đã đăng xuất. Vui lòng đăng nhập lại.',
        'REFRESH_TOKEN_REVOKED'
      );
    }

    // 3. Kiểm tra thời hạn Refresh Token
    if (tokenEntity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        'REFRESH_TOKEN_EXPIRED'
      );
    }

    // 4. Kiểm tra tài khoản người dùng
    const user = await this.userRepository.findById(tokenEntity.userId);
    if (!user || !user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị tạm khóa hoặc không tồn tại. Vui lòng liên hệ Quản trị viên.',
        'ACCOUNT_LOCKED'
      );
    }

    // 5. Kiểm tra trạng thái khóa trong RAM Blacklist tức thời
    if (this.tokenBlacklistService?.isUserRevoked && this.tokenBlacklistService.isUserRevoked(user.id || '')) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.',
        'ACCOUNT_LOCKED'
      );
    }

    // 6. Xoay Vòng Token (Refresh Token Rotation - OAuth 2.0 BCP)
    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = this.tokenService.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    // Đánh dấu token cũ đã thu hồi và lưu vết token thay thế
    await this.refreshTokenRepository.revoke(tokenHash, newTokenHash);

    // Lưu token mới vào CSDL
    await this.refreshTokenRepository.create({
      userId: user.id || '',
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    // 7. Cấp Access Token ngắn hạn mới (15 phút)
    const accessTokenResult = this.tokenService.generateAccessToken({
      userId: user.id || '',
      username: user.username,
      role: user.role,
    });

    return {
      accessToken: accessTokenResult.accessToken,
      expiresIn: accessTokenResult.expiresIn,
      refreshToken: newRawRefreshToken,
    };
  }
}
