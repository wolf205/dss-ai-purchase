import { UpdateUserUseCase } from '../../../src/application/use-cases/user/UpdateUserUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { EntityNotFoundException, DuplicateResourceException } from '../../../src/application/exceptions';
import { User } from '../../../src/domain/entities/User';

describe('UpdateUserUseCase (UC-016 / FR-032 / FR-033)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let updateUserUseCase: UpdateUserUseCase;

  const targetUserId = 'target-user-uuid-1';
  const operatorUserId = 'admin-user-uuid-99';

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
    updateUserUseCase = new UpdateUserUseCase(mockUserRepo, mockPasswordHasher);
  });

  it('should update fullName and email successfully, normalizing email to lowercase and trimming', async () => {
    const existingUser = new User({
      id: targetUserId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nguyễn Văn A',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.update.mockImplementation(async (u: User) => u);

    const result = await updateUserUseCase.execute(
      targetUserId,
      {
        fullName: '  Nguyễn Văn A Cập Nhật  ',
        email: '  Staff_Updated@DSS.VN  ',
      },
      operatorUserId
    );

    expect(mockUserRepo.findById).toHaveBeenCalledWith(targetUserId);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('staff_updated@dss.vn');
    expect(result.fullName).toBe('Nguyễn Văn A Cập Nhật');
    expect(result.email).toBe('staff_updated@dss.vn');
    expect(result.username).toBe('staff01'); // Username is preserved
  });

  it('should update role from STAFF to ADMIN successfully', async () => {
    const existingUser = new User({
      id: targetUserId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên Mua Hàng',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockImplementation(async (u: User) => u);

    const result = await updateUserUseCase.execute(
      targetUserId,
      { role: 'ADMIN' },
      operatorUserId
    );

    expect(result.role).toBe('ADMIN');
    expect(mockUserRepo.update).toHaveBeenCalled();
  });

  it('should allow updating email with different casing of the current user email without duplicate error', async () => {
    const existingUser = new User({
      id: targetUserId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên Mua Hàng',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    // findByEmail returns the same user record
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    mockUserRepo.update.mockImplementation(async (u: User) => u);

    const result = await updateUserUseCase.execute(
      targetUserId,
      { email: 'Staff01@DSS.VN' },
      operatorUserId
    );

    expect(result.email).toBe('staff01@dss.vn');
  });

  it('should throw DuplicateResourceException when email is taken by another user', async () => {
    const existingUser = new User({
      id: targetUserId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Nhân Viên A',
      email: 'staff01@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    const otherUser = new User({
      id: 'another-user-uuid',
      username: 'staff02',
      passwordHash: 'hash',
      fullName: 'Nhân Viên B',
      email: 'existing_other@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.findByEmail.mockResolvedValue(otherUser);

    await expect(
      updateUserUseCase.execute(
        targetUserId,
        { email: 'existing_other@dss.vn' },
        operatorUserId
      )
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it('should throw EntityNotFoundException when user id does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      updateUserUseCase.execute(
        'non-existent-uuid',
        { fullName: 'Tên Mới' },
        operatorUserId
      )
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it('should update only fullName without triggering email verification if email is undefined', async () => {
    const existingUser = new User({
      id: targetUserId,
      username: 'staff01',
      passwordHash: 'hash',
      fullName: 'Tên Cũ',
      email: 'keep_email@dss.vn',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockImplementation(async (u: User) => u);

    const result = await updateUserUseCase.execute(
      targetUserId,
      { fullName: 'Tên Mới Được Đổi' },
      operatorUserId
    );

    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(result.fullName).toBe('Tên Mới Được Đổi');
    expect(result.email).toBe('keep_email@dss.vn');
  });
});
