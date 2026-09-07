import { ChangePasswordUseCase } from '../../../src/application/use-cases/auth/ChangePasswordUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { User } from '../../../src/domain/entities/User';
import { ValidationException } from '../../../src/application/exceptions/ValidationException';
import { UnauthorizedException } from '../../../src/application/exceptions/UnauthorizedException';
import { EntityNotFoundException } from '../../../src/application/exceptions/EntityNotFoundException';

describe('ChangePasswordUseCase (UC-015)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
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
    changePasswordUseCase = new ChangePasswordUseCase(mockUserRepo, mockPasswordHasher);
  });

  it('should change password successfully when credentials are valid', async () => {
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
    });

    expect(result.message).toContain('Đổi mật khẩu thành công');
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith('CurrentPassword@123', 'old_hashed_pwd');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewSecurePassword@456');
    expect(user.passwordHash).toBe('new_hashed_pwd');
    expect(user.mustChangePassword).toBe(false);
  });

  it('should throw ValidationException if new password is too short', async () => {
    await expect(
      changePasswordUseCase.execute({
        userId: 'user-uuid-1',
        oldPassword: 'CurrentPassword@123',
        newPassword: '123',
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

  it('should throw EntityNotFoundException if user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      changePasswordUseCase.execute({
        userId: 'non-existent-user',
        oldPassword: 'CurrentPassword@123',
        newPassword: 'NewSecurePassword@456',
      })
    ).rejects.toThrow(EntityNotFoundException);
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
