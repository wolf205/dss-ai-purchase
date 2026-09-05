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

  public async execute(dto: CreateUserRequestDTO): Promise<UserResponseDTO> {
    if (!dto.username || !dto.password || !dto.fullName || !dto.email) {
      throw new ValidationException('Vui lòng điền đầy đủ tất cả các trường thông tin');
    }

    const existingUsername = await this.userRepository.findByUsername(dto.username.trim());
    if (existingUsername) {
      throw new DuplicateResourceException('Tên đăng nhập', dto.username);
    }

    const existingEmail = await this.userRepository.findByEmail(dto.email.trim());
    if (existingEmail) {
      throw new DuplicateResourceException('Email', dto.email);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = new User({
      username: dto.username.trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
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
