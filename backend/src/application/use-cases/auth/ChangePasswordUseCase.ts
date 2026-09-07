import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ValidationException, UnauthorizedException, EntityNotFoundException } from '../../exceptions';

export interface ChangePasswordDTO {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  public async execute(dto: ChangePasswordDTO): Promise<{ message: string }> {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new ValidationException('Mật khẩu hiện tại và mật khẩu mới không được để trống');
    }

    if (dto.newPassword.length < 6) {
      throw new ValidationException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new ValidationException('Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new EntityNotFoundException('người dùng', dto.userId);
    }

    const isOldPasswordValid = await this.passwordHasher.compare(dto.oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác', 'INVALID_CREDENTIALS');
    }

    const newPasswordHash = await this.passwordHasher.hash(dto.newPassword);
    user.updatePassword(newPasswordHash);
    await this.userRepository.update(user);

    return {
      message: 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.',
    };
  }
}
