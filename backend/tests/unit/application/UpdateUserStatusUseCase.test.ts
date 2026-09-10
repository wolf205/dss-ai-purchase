import { UpdateUserStatusUseCase } from '../../../src/application/use-cases/user/UpdateUserStatusUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { ITokenBlacklistService } from '../../../src/application/ports/ITokenBlacklistService';
import { EntityNotFoundException } from '../../../src/application/exceptions';
import { DomainException } from '../../../src/domain/exceptions/DomainException';
import { User } from '../../../src/domain/entities/User';

describe('UpdateUserStatusUseCase (UC-016 / BR-021)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockTokenBlacklist: jest.Mocked<ITokenBlacklistService>;
  let useCase: UpdateUserStatusUseCase;

  const currentAdminId = 'admin-uuid-1';
  const secondAdminId = 'admin-uuid-2';
  const staffId = 'staff-uuid-1';

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
    mockTokenBlacklist = {
      revoke: jest.fn(),
      isRevoked: jest.fn(),
      revokeUser: jest.fn(),
      unrevokeUser: jest.fn(),
      isUserRevoked: jest.fn(),
    };
    useCase = new UpdateUserStatusUseCase(mockUserRepo, mockTokenBlacklist);
  });

  it('should lock a staff user and revoke active sessions immediately', async () => {
    const staff = new User({
      id: staffId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên A',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(staff);
    mockUserRepo.update.mockImplementation(async (u) => u);

    const result = await useCase.execute(staffId, false, currentAdminId);

    expect(result.isActive).toBe(false);
    expect(mockUserRepo.update).toHaveBeenCalled();
    expect(mockTokenBlacklist.revokeUser).toHaveBeenCalledWith(staffId);
    expect(mockTokenBlacklist.unrevokeUser).not.toHaveBeenCalled();
  });

  it('should unlock a staff user and restore access', async () => {
    const staff = new User({
      id: staffId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên A',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: false, // Currently locked
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(staff);
    mockUserRepo.update.mockImplementation(async (u) => u);

    const result = await useCase.execute(staffId, true, currentAdminId);

    expect(result.isActive).toBe(true);
    expect(mockUserRepo.update).toHaveBeenCalled();
    expect(mockTokenBlacklist.unrevokeUser).toHaveBeenCalledWith(staffId);
    expect(mockTokenBlacklist.revokeUser).not.toHaveBeenCalled();
  });

  it('should optimize idempotency: return immediately without updating DB if status is unchanged', async () => {
    const staff = new User({
      id: staffId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên A',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true, // Already active
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(staff);

    const result = await useCase.execute(staffId, true, currentAdminId);

    expect(result.isActive).toBe(true);
    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockTokenBlacklist.revokeUser).not.toHaveBeenCalled();
    expect(mockTokenBlacklist.unrevokeUser).not.toHaveBeenCalled();
  });

  it('should throw DomainException when Admin attempts to lock their own account (UC-016 Luồng E3)', async () => {
    const currentAdmin = new User({
      id: currentAdminId,
      username: 'admin',
      passwordHash: 'hash',
      fullName: 'Quản Trị Viên',
      email: 'admin@dss.vn',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(currentAdmin);

    await expect(
      useCase.execute(currentAdminId, false, currentAdminId)
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(currentAdminId, false, currentAdminId)
    ).rejects.toThrow('Không thể tự khóa tài khoản quản trị của chính bạn');

    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockTokenBlacklist.revokeUser).not.toHaveBeenCalled();
  });

  it('should throw DomainException when attempting to lock the ONLY active admin in system (UC-016 Luồng E4)', async () => {
    const targetAdmin = new User({
      id: secondAdminId,
      username: 'admin2',
      passwordHash: 'hash',
      fullName: 'Admin Thứ Hai',
      email: 'admin2@dss.vn',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(targetAdmin);
    mockUserRepo.findAll.mockResolvedValue({ users: [targetAdmin], total: 1 });

    await expect(
      useCase.execute(secondAdminId, false, currentAdminId)
    ).rejects.toThrow(DomainException);

    await expect(
      useCase.execute(secondAdminId, false, currentAdminId)
    ).rejects.toThrow('tài khoản Quản trị viên duy nhất đang hoạt động');

    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockTokenBlacklist.revokeUser).not.toHaveBeenCalled();
  });

  it('should throw EntityNotFoundException when user id does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent-uuid', false, currentAdminId)
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });
});
