import { ManageUserUseCase } from '../../../src/application/use-cases/user/ManageUserUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { User } from '../../../src/domain/entities/User';
import { DomainException } from '../../../src/domain/exceptions/DomainException';

describe('ManageUserUseCase Admin Protection (UC-016 Luồng E3, E4)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let manageUserUseCase: ManageUserUseCase;

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
    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    manageUserUseCase = new ManageUserUseCase(mockUserRepo, mockPasswordHasher);
  });

  describe('Self-Lock & Self-Demote Protection (UC-016 Luồng E3)', () => {
    it('should throw DomainException when Admin attempts to lock their own account', async () => {
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
        manageUserUseCase.setStatus(currentAdminId, false, currentAdminId)
      ).rejects.toThrow(DomainException);

      await expect(
        manageUserUseCase.setStatus(currentAdminId, false, currentAdminId)
      ).rejects.toThrow('Không thể tự khóa tài khoản quản trị của chính bạn');
    });

    it('should throw DomainException when Admin attempts to demote their own role to STAFF', async () => {
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
        manageUserUseCase.update.execute(currentAdminId, { role: 'STAFF' }, currentAdminId)
      ).rejects.toThrow(DomainException);

      await expect(
        manageUserUseCase.update.execute(currentAdminId, { role: 'STAFF' }, currentAdminId)
      ).rejects.toThrow('Không thể tự hạ quyền quản trị của chính bạn');
    });
  });

  describe('Minimum Active Admin Protection (UC-016 Luồng E4)', () => {
    it('should throw DomainException when attempting to lock the ONLY active admin in system', async () => {
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
      // Chỉ còn đúng 1 admin đang hoạt động trong hệ thống
      mockUserRepo.findAll.mockResolvedValue({ users: [targetAdmin], total: 1 });

      await expect(
        manageUserUseCase.setStatus(secondAdminId, false, currentAdminId)
      ).rejects.toThrow(DomainException);

      await expect(
        manageUserUseCase.setStatus(secondAdminId, false, currentAdminId)
      ).rejects.toThrow('tài khoản Quản trị viên duy nhất đang hoạt động');
    });

    it('should throw DomainException when attempting to demote the ONLY active admin to STAFF', async () => {
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
      // Chỉ còn đúng 1 admin đang hoạt động trong hệ thống
      mockUserRepo.findAll.mockResolvedValue({ users: [targetAdmin], total: 1 });

      await expect(
        manageUserUseCase.update.execute(secondAdminId, { role: 'STAFF' }, currentAdminId)
      ).rejects.toThrow(DomainException);

      await expect(
        manageUserUseCase.update.execute(secondAdminId, { role: 'STAFF' }, currentAdminId)
      ).rejects.toThrow('tài khoản Quản trị viên duy nhất đang hoạt động');
    });

    it('should allow locking an admin when at least one other active admin remains', async () => {
      const admin1 = new User({
        id: currentAdminId,
        username: 'admin1',
        passwordHash: 'hash',
        fullName: 'Admin 1',
        email: 'admin1@dss.vn',
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
      });
      const admin2 = new User({
        id: secondAdminId,
        username: 'admin2',
        passwordHash: 'hash',
        fullName: 'Admin 2',
        email: 'admin2@dss.vn',
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
      });

      mockUserRepo.findById.mockResolvedValue(admin2);
      mockUserRepo.findAll.mockResolvedValue({ users: [admin1, admin2], total: 2 }); // 2 active admins
      mockUserRepo.update.mockImplementation(async (u) => u);

      const result = await manageUserUseCase.setStatus(secondAdminId, false, currentAdminId);
      expect(result.isActive).toBe(false);
      expect(mockUserRepo.update).toHaveBeenCalled();
    });
  });

  describe('Normal Staff Operation', () => {
    it('should allow locking or unlocking a STAFF user without admin restrictions', async () => {
      const staff = new User({
        id: staffId,
        username: 'staff01',
        passwordHash: 'hash',
        fullName: 'Nhân viên A',
        email: 'staff01@dss.vn',
        role: 'STAFF',
        isActive: true,
        mustChangePassword: false,
      });

      mockUserRepo.findById.mockResolvedValue(staff);
      mockUserRepo.update.mockImplementation(async (u) => u);

      const locked = await manageUserUseCase.setStatus(staffId, false, currentAdminId);
      expect(locked.isActive).toBe(false);

      const unlocked = await manageUserUseCase.setStatus(staffId, true, currentAdminId);
      expect(unlocked.isActive).toBe(true);
    });
  });
});
