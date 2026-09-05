import { LoginUseCase } from '../../../src/application/use-cases/auth/LoginUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { ITokenService } from '../../../src/application/ports/ITokenService';
import { User } from '../../../src/domain/entities/User';
import { UnauthorizedException } from '../../../src/application/exceptions/UnauthorizedException';
import { ForbiddenException } from '../../../src/application/exceptions/ForbiddenException';

describe('LoginUseCase (UC-015)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    mockTokenService = {
      generateTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    loginUseCase = new LoginUseCase(mockUserRepo, mockPasswordHasher, mockTokenService);
  });

  it('should authenticate user and return token pair on valid credentials', () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'admin',
      passwordHash: 'hashed_password',
      fullName: 'Quản trị viên',
      email: 'admin@dss.com',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUserRepo.findByUsername.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockTokenService.generateTokenPair.mockReturnValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresIn: 900,
    });
    mockUserRepo.update.mockResolvedValue(user);

    return expect(
      loginUseCase.execute({ username: 'admin', password: 'password123' })
    ).resolves.toEqual({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresIn: 900,
      user: {
        id: 'user-uuid-1',
        username: 'admin',
        fullName: 'Quản trị viên',
        email: 'admin@dss.com',
        role: 'ADMIN',
        mustChangePassword: false,
      },
    });
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'admin',
      passwordHash: 'hashed_password',
      fullName: 'Quản trị viên',
      email: 'admin@dss.com',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUserRepo.findByUsername.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'wrong_password' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when user is locked (isActive: false)', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'admin',
      passwordHash: 'hashed_password',
      fullName: 'Quản trị viên',
      email: 'admin@dss.com',
      role: 'ADMIN',
      isActive: false,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUserRepo.findByUsername.mockResolvedValue(user);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'password123' })
    ).rejects.toThrow(ForbiddenException);
  });
});
