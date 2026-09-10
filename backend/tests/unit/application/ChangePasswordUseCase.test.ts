import { ChangePasswordUseCase } from '../../../src/application/use-cases/auth/ChangePasswordUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { ITokenBlacklistService } from '../../../src/application/ports/ITokenBlacklistService';
import { User } from '../../../src/domain/entities/User';
import { ValidationException, UnauthorizedException, ForbiddenException } from '../../../src/application/exceptions';

describe('ChangePasswordUseCase (UC-015)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenBlacklistService: jest.Mocked<ITokenBlacklistService>;
  let changePasswordUseCase: ChangePasswordUseCase;

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
    mockTokenBlacklistService = {
      revoke: jest.fn(),
      isRevoked: jest.fn(),
      revokeUser: jest.fn(),
      unrevokeUser: jest.fn(),
      isUserRevoked: jest.fn(),
      revokeUserTokensBefore: jest.fn(),
      isTokenIssuedBeforeRevocation: jest.fn(),
    };
    changePasswordUseCase = new ChangePasswordUseCase(
      mockUserRepo,
      mockPasswordHasher,
      mockTokenBlacklistService
    );
  });

  it('should change password successfully and revoke current token', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'staff01',
      passwordHash: 'old_hashed_pwd',
      fullName: 'Nhân viên 01',
      email: 'staff01@dss.com',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: true,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new_hashed_pwd');
    mockUserRepo.update.mockResolvedValue(user);

    const result = await changePasswordUseCase.execute({
      userId: 'user-uuid-1',
      oldPassword: 'CurrentPassword@123',
      newPassword: 'NewSecurePassword@456',
      token: 'jwt-session-token-to-revoke',
    });

    expect(result.message).toContain('Đổi mật khẩu thành công');
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith('CurrentPassword@123', 'old_hashed_pwd');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewSecurePassword@456');
    expect(mockTokenBlacklistService.revoke).toHaveBeenCalledWith('jwt-session-token-to-revoke', 900);
    expect(mockTokenBlacklistService.revokeUserTokensBefore).toHaveBeenCalledWith('user-uuid-1');

    expect(user.passwordHash).toBe('new_hashed_pwd');
    expect(user.mustChangePassword).toBe(false);
  });

  it('should change password successfully even if token is not provided', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'staff01',
      passwordHash: 'old_hashed_pwd',
      fullName: 'Nhân viên 01',
      email: 'staff01@dss.com',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new_hashed_pwd');
    mockUserRepo.update.mockResolvedValue(user);

    const result = await changePasswordUseCase.execute({
      userId: 'user-uuid-1',
      oldPassword: 'CurrentPassword@123',
      newPassword: 'NewSecurePassword@456',
    });

    expect(result.message).toContain('Đổi mật khẩu thành công');
    expect(mockTokenBlacklistService.revoke).not.toHaveBeenCalled();
    expect(mockTokenBlacklistService.revokeUserTokensBefore).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should throw ValidationException if new password is too short (< 8 chars)', async () => {
    await expect(
      changePasswordUseCase.execute({
        userId: 'user-uuid-1',
        oldPassword: 'CurrentPassword@123',
        newPassword: 'short',
      })
    ).rejects.toThrow(ValidationException);
  });

  it('should throw ValidationException if new password is identical to old password', async () => {
    await expect(
      changePasswordUseCase.execute({
        userId: 'user-uuid-1',
        oldPassword: 'SamePassword@123',
        newPassword: 'SamePassword@123',
      })
    ).rejects.toThrow(ValidationException);
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      changePasswordUseCase.execute({
        userId: 'non-existent-user',
        oldPassword: 'CurrentPassword@123',
        newPassword: 'NewSecurePassword@456',
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException (ACCOUNT_LOCKED) if account is deactivated (BR-021)', async () => {
    const lockedUser = new User({
      id: 'user-locked-1',
      username: 'locked_staff',
      passwordHash: 'old_hashed_pwd',
      fullName: 'Nhân viên Khóa',
      email: 'locked@dss.com',
      role: 'STAFF',
      isActive: false,
      mustChangePassword: true,
    });

    mockUserRepo.findById.mockResolvedValue(lockedUser);

    await expect(
      changePasswordUseCase.execute({
        userId: 'user-locked-1',
        oldPassword: 'CurrentPassword@123',
        newPassword: 'NewSecurePassword@456',
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException if old password does not match', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'staff01',
      passwordHash: 'old_hashed_pwd',
      fullName: 'Nhân viên 01',
      email: 'staff01@dss.com',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: true,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      changePasswordUseCase.execute({
        userId: 'user-uuid-1',
        oldPassword: 'WrongPassword@123',
        newPassword: 'NewSecurePassword@456',
      })
    ).rejects.toThrow(UnauthorizedException);
  });
});
