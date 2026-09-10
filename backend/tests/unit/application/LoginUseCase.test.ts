import { LoginUseCase } from '../../../src/application/use-cases/auth/LoginUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { ITokenService } from '../../../src/application/ports/ITokenService';
import { ILoginAttemptTracker } from '../../../src/application/ports/ILoginAttemptTracker';
import { User } from '../../../src/domain/entities/User';
import {
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
  TooManyRequestsException,
} from '../../../src/application/exceptions';

describe('LoginUseCase (UC-015, DEC-API-003, NFR-004)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockTracker: jest.Mocked<ILoginAttemptTracker>;
  let loginUseCase: LoginUseCase;

  const createActiveUser = (overrides?: Partial<ConstructorParameters<typeof User>[0]>) =>
    new User({
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
      ...overrides,
    });

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
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      hashToken: jest.fn().mockReturnValue('mock-hash'),
      verifyAccessToken: jest.fn(),
    };

    mockTracker = {
      isBlocked: jest.fn().mockResolvedValue(false),
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      resetAttempts: jest.fn().mockResolvedValue(undefined),
      getRemainingLockSeconds: jest.fn().mockReturnValue(0),
    };

    loginUseCase = new LoginUseCase(
      mockUserRepo,
      mockPasswordHasher,
      mockTokenService,
      mockTracker
    );
  });

  it('should authenticate user and return stateless accessToken with expiresIn 28800 (DEC-API-003)', async () => {
    const user = createActiveUser();
    mockUserRepo.findByUsername.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockTokenService.generateAccessToken.mockReturnValue({
      accessToken: 'stateless_mock_jwt_token',
      expiresIn: 28800,
    });
    mockUserRepo.update.mockResolvedValue(user);

    const result = await loginUseCase.execute({
      username: 'admin',
      password: 'correct_password',
    });

    expect(result).toEqual({
      accessToken: 'stateless_mock_jwt_token',
      expiresIn: 28800,
      user: {
        id: 'user-uuid-1',
        username: 'admin',
        fullName: 'Quản trị viên',
        email: 'admin@dss.com',
        role: 'ADMIN',
        mustChangePassword: false,
      },
    });

    // Reset brute-force counter on success
    expect(mockTracker.resetAttempts).toHaveBeenCalledWith('admin');
    // Updated lastLoginAt
    expect(mockUserRepo.update).toHaveBeenCalled();
  });

  it('should throw ValidationException when username or password is missing', async () => {
    await expect(
      loginUseCase.execute({ username: '', password: 'password123' })
    ).rejects.toThrow(ValidationException);

    await expect(
      loginUseCase.execute({ username: 'admin', password: '' })
    ).rejects.toThrow(ValidationException);
  });

  it('should throw UnauthorizedException with INVALID_CREDENTIALS when user does not exist', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({ username: 'nonexistent', password: 'password123' })
    ).rejects.toThrow(UnauthorizedException);

    expect(mockTracker.recordFailedAttempt).toHaveBeenCalledWith('nonexistent');
  });

  it('should throw UnauthorizedException with INVALID_CREDENTIALS on wrong password and record attempt', async () => {
    const user = createActiveUser();
    mockUserRepo.findByUsername.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'wrong_password' })
    ).rejects.toThrow(UnauthorizedException);

    expect(mockTracker.recordFailedAttempt).toHaveBeenCalledWith('admin');
    expect(mockTracker.resetAttempts).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException with ACCOUNT_LOCKED when user account is deactivated (UC-015 E2)', async () => {
    const user = createActiveUser({ isActive: false });
    mockUserRepo.findByUsername.mockResolvedValue(user);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'password123' })
    ).rejects.toThrow(ForbiddenException);

    // Does not check password if account is locked
    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
  });

  it('should throw TooManyRequestsException with TOO_MANY_REQUESTS when brute-force threshold is reached (NFR-004)', async () => {
    mockTracker.isBlocked.mockResolvedValue(true);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'any_password' })
    ).rejects.toThrow(TooManyRequestsException);

    // Should not hit DB when blocked
    expect(mockUserRepo.findByUsername).not.toHaveBeenCalled();
  });
});
