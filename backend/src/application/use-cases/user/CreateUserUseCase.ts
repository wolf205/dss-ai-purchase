import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { CreateUserRequestDTO, UserResponseDTO } from '../../dtos/AuthDTO';
import { User } from '../../../domain/entities/User';
import { ValidationException, DuplicateResourceException } from '../../exceptions';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  public async execute(
    dto: CreateUserRequestDTO,
    _operatorUserId?: string
  ): Promise<UserResponseDTO> {
    if (!dto.username || !dto.password || !dto.fullName || !dto.email) {
      throw new ValidationException('Vui lòng điền đầy đủ tất cả các trường thông tin');
    }

    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new DuplicateResourceException('Tên đăng nhập', username);
    }

    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new DuplicateResourceException('Email', email);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = new User({
      username,
      passwordHash,
      fullName,
      email,
      role: dto.role || 'STAFF',
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id || '',
      username: savedUser.username,
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      isActive: savedUser.isActive,
      mustChangePassword: savedUser.mustChangePassword,
      lastLoginAt: savedUser.lastLoginAt,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
