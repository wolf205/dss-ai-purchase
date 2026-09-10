import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { ITokenService } from '../../ports/ITokenService';
import { ValidationException } from '../../exceptions';

export interface LogoutResponseDTO {
  message: string;
}

/**
 * UseCase: UC-015 Flow A3 - Logout session revocation.
 * Revokes the current session JWT token by blacklisting it in the server-side store
 * and revokes the corresponding refresh token in the database.
 */
export class LogoutUseCase {
  constructor(
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly refreshTokenRepository?: IRefreshTokenRepository,
    private readonly tokenService?: ITokenService
  ) {}

  public async execute(token: string, refreshToken?: string): Promise<LogoutResponseDTO> {
    if (!token || !token.trim()) {
      throw new ValidationException('Token xác thực không được để trống');
    }

    // 1. Thu hồi Access Token trong RAM Blacklist
    const defaultTtlSeconds = 900; // 15m
    await this.tokenBlacklistService.revoke(token.trim(), defaultTtlSeconds);

    // 2. Thu hồi Refresh Token trong CSDL nếu có
    if (refreshToken && refreshToken.trim() && this.refreshTokenRepository && this.tokenService) {
      const tokenHash = this.tokenService.hashToken(refreshToken.trim());
      await this.refreshTokenRepository.revoke(tokenHash);
    }

    return {
      message: 'Đăng xuất thành công.',
    };
  }
}

