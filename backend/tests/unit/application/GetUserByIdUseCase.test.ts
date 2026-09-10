import { GetUserByIdUseCase } from '../../../src/application/use-cases/user/GetUserByIdUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { EntityNotFoundException } from '../../../src/application/exceptions';
import { User } from '../../../src/domain/entities/User';

describe('GetUserByIdUseCase (UC-016 / FR-032)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let getUserByIdUseCase: GetUserByIdUseCase;

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
    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepo);
  });

  it('should return user details successfully by ID without credential leakage', async () => {
    const existingUser = new User({
      id: 'b0000000-0000-0000-0000-000000000003',
      username: 'staff_kho',
      passwordHash: 'secret_bcrypt_hash',
      fullName: 'Trần Thị B',
      email: 'tranthib@dss-purchase.local',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date('2026-09-04T09:00:00.000Z'),
      updatedAt: new Date('2026-09-04T09:00:00.000Z'),
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);

    const result = await getUserByIdUseCase.execute('b0000000-0000-0000-0000-000000000003');

    expect(mockUserRepo.findById).toHaveBeenCalledWith('b0000000-0000-0000-0000-000000000003');
    expect(result.id).toBe('b0000000-0000-0000-0000-000000000003');
    expect(result.username).toBe('staff_kho');
    expect(result.fullName).toBe('Trần Thị B');
    expect(result.email).toBe('tranthib@dss-purchase.local');
    expect(result.role).toBe('STAFF');
    expect(result.isActive).toBe(true);
    expect(result.mustChangePassword).toBe(true);
    expect(result.lastLoginAt).toBeNull();
    expect((result as any).passwordHash).toBeUndefined(); // Zero credential leakage
  });

  it('should throw EntityNotFoundException when user is not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      getUserByIdUseCase.execute('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow(EntityNotFoundException);

    expect(mockUserRepo.findById).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000');
  });
});
