import { CreateUserUseCase } from '../../../src/application/use-cases/user/CreateUserUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../src/application/ports/IPasswordHasher';
import { ValidationException, DuplicateResourceException } from '../../../src/application/exceptions';
import { User } from '../../../src/domain/entities/User';

describe('CreateUserUseCase (UC-016 / FR-032)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let createUserUseCase: CreateUserUseCase;

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
    createUserUseCase = new CreateUserUseCase(mockUserRepo, mockPasswordHasher);
  });

  it('should create user successfully with default STAFF role, isActive=true, and mustChangePassword=true', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('hashed_initial_password');

    mockUserRepo.save.mockImplementation(async (user: User) => {
      return new User({
        id: 'new-user-uuid-1',
        username: user.username,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    const result = await createUserUseCase.execute({
      username: '  staff_kho  ',
      password: 'InitialPassword@123',
      fullName: '  Trần Thị B  ',
      email: '  TranThiB@DSS-PURCHASE.LOCAL  ',
    });

    expect(mockUserRepo.findByUsername).toHaveBeenCalledWith('staff_kho');
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('tranthib@dss-purchase.local');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('InitialPassword@123');

    expect(result.id).toBe('new-user-uuid-1');
    expect(result.username).toBe('staff_kho');
    expect(result.fullName).toBe('Trần Thị B');
    expect(result.email).toBe('tranthib@dss-purchase.local');
    expect(result.role).toBe('STAFF');
    expect(result.isActive).toBe(true);
    expect(result.mustChangePassword).toBe(true);
    expect((result as any).passwordHash).toBeUndefined(); // Zero credential leakage
  });

  it('should create user with explicitly specified ADMIN role', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('hashed_admin_password');

    mockUserRepo.save.mockImplementation(async (user: User) => {
      return new User({
        id: 'admin-user-uuid-2',
        username: user.username,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    const result = await createUserUseCase.execute({
      username: 'sub_admin',
      password: 'AdminPassword@123',
      fullName: 'Phó Quản Trị Viên',
      email: 'subadmin@dss-purchase.local',
      role: 'ADMIN',
    });

    expect(result.role).toBe('ADMIN');
  });

  it('should throw DuplicateResourceException when username already exists', async () => {
    const existingUser = new User({
      id: 'existing-id',
      username: 'staff_kho',
      passwordHash: 'hash',
      fullName: 'Cũ',
      email: 'old@dss.com',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findByUsername.mockResolvedValue(existingUser);

    await expect(
      createUserUseCase.execute({
        username: 'staff_kho',
        password: 'InitialPassword@123',
        fullName: 'Trần Thị B',
        email: 'tranthib@dss.com',
      })
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
  });

  it('should throw DuplicateResourceException when email already exists (case-insensitive check)', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);

    const existingUser = new User({
      id: 'existing-id',
      username: 'other_user',
      passwordHash: 'hash',
      fullName: 'Cũ',
      email: 'tranthib@dss.com',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
    });

    mockUserRepo.findByEmail.mockResolvedValue(existingUser);

    await expect(
      createUserUseCase.execute({
        username: 'new_staff',
        password: 'InitialPassword@123',
        fullName: 'Trần Thị B',
        email: 'TranThiB@DSS.COM', // Uppercase input
      })
    ).rejects.toThrow(DuplicateResourceException);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('tranthib@dss.com');
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
  });

  it('should throw ValidationException when required fields are missing', async () => {
    await expect(
      createUserUseCase.execute({
        username: '',
        password: 'InitialPassword@123',
        fullName: 'Trần Thị B',
        email: 'tranthib@dss.com',
      })
    ).rejects.toThrow(ValidationException);

    await expect(
      createUserUseCase.execute({
        username: 'staff01',
        password: '',
        fullName: 'Trần Thị B',
        email: 'tranthib@dss.com',
      })
    ).rejects.toThrow(ValidationException);
  });
});
