import { ResetPasswordUseCase } from '../../../src/application/use-cases/user/ResetPasswordUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { ITokenBlacklistService } from '../../../src/application/ports/ITokenBlacklistService';
import { IRefreshTokenRepository } from '../../../src/domain/repositories/IRefreshTokenRepository';
import { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository';
import { User } from '../../../src/domain/entities/User';
import { ValidationException } from '../../../src/application/exceptions/ValidationException';
import { EntityNotFoundException } from '../../../src/application/exceptions/EntityNotFoundException';
import { ForbiddenException } from '../../../src/application/exceptions/ForbiddenException';
import { DomainException } from '../../../src/domain/exceptions/DomainException';

describe('ResetPasswordUseCase (UC-016 Luồng A4, FR-032, BR-021)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenBlacklistService: jest.Mocked<ITokenBlacklistService>;
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let mockAuditLogRepo: jest.Mocked<IAuditLogRepository>;
  let resetPasswordUseCase: ResetPasswordUseCase;

  const adminId = 'admin-uuid-001';
  const staffId = 'staff-uuid-001';

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
    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    mockAuditLogRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    resetPasswordUseCase = new ResetPasswordUseCase(
      mockUserRepo,
      mockPasswordHasher,
      mockTokenBlacklistService,
      mockRefreshTokenRepo,
      mockAuditLogRepo
    );
  });

  it('should reset password with custom new password and set mustChangePassword = true', async () => {
    const user = new User({
      id: staffId,
      username: 'staff01',
      passwordHash: 'old_hashed_pwd',
      fullName: 'Nhân Viên Mua Hàng',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.hash.mockResolvedValue('new_hashed_temp_pwd');
    mockUserRepo.update.mockImplementation(async (u) => u);

    const result = await resetPasswordUseCase.execute(
      staffId,
      { newPassword: 'TempPassword@2026' },
      adminId,
      '192.168.1.100'
    );

    expect(result.id).toBe(staffId);
    expect(result.username).toBe('staff01');
    expect(result.mustChangePassword).toBe(true);
    expect(result.temporaryPassword).toBe('TempPassword@2026');
    expect(result.message).toContain('Đã đặt lại mật khẩu cho tài khoản staff01 thành công');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('TempPassword@2026');
    expect(user.passwordHash).toBe('new_hashed_temp_pwd');
    expect(user.mustChangePassword).toBe(true);

    // Verify token revocation
    expect(mockTokenBlacklistService.revokeUserTokensBefore).toHaveBeenCalledWith(staffId);
    expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(staffId);

    // Verify audit log
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: adminId,
        action: 'USER_PASSWORD_RESET',
        entityName: 'users',
        entityId: staffId,
        ipAddress: '192.168.1.100',
      })
    );
  });

  it('should generate a secure CSPRNG random password if newPassword is not provided', async () => {
    const user = new User({
      id: staffId,
      username: 'staff02',
      passwordHash: 'old_hash',
      fullName: 'Nhân Viên Kho',
      email: 'staff02@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.hash.mockResolvedValue('generated_hash');
    mockUserRepo.update.mockImplementation(async (u) => u);

    const result = await resetPasswordUseCase.execute(staffId, {}, adminId);

    expect(result.temporaryPassword).toBeDefined();
    const tempPass = result.temporaryPassword!;
    expect(tempPass.length).toBe(10);
    // Phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
    expect(/[A-Z]/.test(tempPass)).toBe(true);
    expect(/[a-z]/.test(tempPass)).toBe(true);
    expect(/[0-9]/.test(tempPass)).toBe(true);
    expect(/[@#$%&*!?]/.test(tempPass)).toBe(true);
    // Không chứa ký tự dễ gây nhầm lẫn: 0, O, I, l, 1
    expect(/[0OIl1]/.test(tempPass)).toBe(false);

    expect(result.mustChangePassword).toBe(true);
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith(tempPass);
    expect(mockAuditLogRepo.create).toHaveBeenCalled();
  });

  it('should throw DomainException if Admin attempts to reset their own password (Self-Reset Protection)', async () => {
    const adminUser = new User({
      id: adminId,
      username: 'admin',
      passwordHash: 'admin_hash',
      fullName: 'Quản Trị Viên',
      email: 'admin@dss.vn',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(adminUser);

    await expect(
      resetPasswordUseCase.execute(adminId, { newPassword: 'NewPassword@2026' }, adminId)
    ).rejects.toThrow(DomainException);

    await expect(
      resetPasswordUseCase.execute(adminId, { newPassword: 'NewPassword@2026' }, adminId)
    ).rejects.toThrow('Không thể tự đặt lại mật khẩu cho tài khoản của chính bạn');
  });

  it('should throw ForbiddenException if target user account is locked/inactive (BR-021)', async () => {
    const lockedUser = new User({
      id: staffId,
      username: 'locked_staff',
      passwordHash: 'old_hash',
      fullName: 'Nhân Viên Đã Nghỉ',
      email: 'locked@dss.vn',
      role: 'STAFF',
      isActive: false, // Inactive / Locked
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(lockedUser);

    await expect(
      resetPasswordUseCase.execute(staffId, { newPassword: 'NewPassword@2026' }, adminId)
    ).rejects.toThrow(ForbiddenException);

    await expect(
      resetPasswordUseCase.execute(staffId, { newPassword: 'NewPassword@2026' }, adminId)
    ).rejects.toThrow('Không thể đặt lại mật khẩu cho tài khoản đang bị khóa');
  });

  it('should throw EntityNotFoundException if target user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      resetPasswordUseCase.execute('non-existent-id', { newPassword: 'TempPassword@2026' }, adminId)
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('should throw ValidationException if provided password is shorter than 8 characters', async () => {
    const user = new User({
      id: staffId,
      username: 'staff03',
      passwordHash: 'old_hash',
      fullName: 'Nhân Viên 03',
      email: 'staff03@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(user);

    await expect(
      resetPasswordUseCase.execute(staffId, { newPassword: 'short' }, adminId)
    ).rejects.toThrow(ValidationException);
  });
});

