import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../ports/ITokenService';
import { RefreshTokenRequestDTO, LoginResponseDTO } from '../../dtos/AuthDTO';
import { ValidationException, UnauthorizedException } from '../../exceptions';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(dto: RefreshTokenRequestDTO): Promise<LoginResponseDTO> {
    if (!dto.refreshToken) {
      throw new ValidationException('Refresh token không được để trống');
    }

    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại', 'TOKEN_EXPIRED');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị vô hiệu hóa', 'UNAUTHORIZED');
    }

    const tokenPair = this.tokenService.generateTokenPair({
      userId: user.id || '',
      username: user.username,
      role: user.role,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id || '',
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
