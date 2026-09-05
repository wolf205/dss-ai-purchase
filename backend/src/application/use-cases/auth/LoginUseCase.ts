import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ITokenService } from '../../ports/ITokenService';
import { LoginRequestDTO, LoginResponseDTO } from '../../dtos/AuthDTO';
import { ValidationException } from '../../../domain/exceptions/ValidationException';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    if (!dto.username || !dto.password) {
      throw new ValidationException('Tên đăng nhập và mật khẩu không được để trống');
    }

    const user = await this.userRepository.findByUsername(dto.username.trim());
    if (!user) {
      throw new ValidationException('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new ValidationException('Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên');
    }

    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationException('Tài khoản hoặc mật khẩu không chính xác');
    }

    // Record login timestamp
    user.recordLogin();
    await this.userRepository.update(user);

    // Generate JWT Token Pair (Access 15m, Refresh 7d)
    const tokenPair = this.tokenService.generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
