import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ITokenService } from '../../ports/ITokenService';
import { ILoginAttemptTracker } from '../../ports/ILoginAttemptTracker';
import { LoginRequestDTO, LoginResponseDTO } from '../../dtos/AuthDTO';
import {
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
  TooManyRequestsException,
} from '../../exceptions';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly loginAttemptTracker?: ILoginAttemptTracker,
    private readonly refreshTokenRepository?: IRefreshTokenRepository
  ) {}


  public async execute(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    if (!dto.username || !dto.password) {
      throw new ValidationException('Tên đăng nhập và mật khẩu không được để trống');
    }

    const trackingKey = dto.username.trim();

    // 1. Kiểm tra kịch bản Brute-force (UC-015 Luồng E1.3, NFR-004)
    if (this.loginAttemptTracker && (await this.loginAttemptTracker.isBlocked(trackingKey))) {
      throw new TooManyRequestsException(
        'Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau 15 phút.',
        'TOO_MANY_REQUESTS'
      );
    }

    // 2. Tìm kiếm tài khoản bằng Username (UC-015 Step 3)
    const user = await this.userRepository.findByUsername(trackingKey);
    if (!user) {
      if (this.loginAttemptTracker) {
        await this.loginAttemptTracker.recordFailedAttempt(trackingKey);
      }
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    // 3. Kiểm tra trạng thái tài khoản bị khóa (UC-015 Luồng E2, BR-021)
    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống để được hỗ trợ.',
        'ACCOUNT_LOCKED'
      );
    }

    // 4. Kiểm tra mã băm mật khẩu
    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      if (this.loginAttemptTracker) {
        await this.loginAttemptTracker.recordFailedAttempt(trackingKey);
      }
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    // 5. Đăng nhập thành công: Reset bộ đếm brute-force & cập nhật lastLoginAt
    if (this.loginAttemptTracker) {
      await this.loginAttemptTracker.resetAttempts(trackingKey);
    }
    user.recordLogin();
    await this.userRepository.update(user);

    // 6. Cấp phát Stateless JWT Access Token thời hạn 15 phút (900 giây)
    const tokenResult = this.tokenService.generateAccessToken({
      userId: user.id || '',
      username: user.username,
      role: user.role,
    });

    // 7. Cấp phát và lưu trữ Refresh Token dài hạn (7 ngày) nếu có repository
    let refreshToken: string | undefined;
    if (this.refreshTokenRepository && user.id) {
      refreshToken = this.tokenService.generateRefreshToken();
      const tokenHash = this.tokenService.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });
    }

    return {
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn,
      ...(refreshToken ? { refreshToken } : {}),
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


