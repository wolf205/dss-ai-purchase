import { GetProfileUseCase } from '../../../src/application/use-cases/auth/GetProfileUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { User } from '../../../src/domain/entities/User';
import { EntityNotFoundException } from '../../../src/application/exceptions/EntityNotFoundException';

describe('GetProfileUseCase (UC-015)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let getProfileUseCase: GetProfileUseCase;

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
    getProfileUseCase = new GetProfileUseCase(mockUserRepo);
  });

  it('should return user profile DTO when user exists', async () => {
    const user = new User({
      id: 'user-uuid-1',
      username: 'staff01',
      passwordHash: 'hashed_pwd',
      fullName: 'Nguyễn Văn A',
      email: 'staff01@dss-purchase.local',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: new Date('2026-09-04T08:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    });

    mockUserRepo.findById.mockResolvedValue(user);

    const profile = await getProfileUseCase.execute('user-uuid-1');

    expect(profile).toEqual({
      id: 'user-uuid-1',
      username: 'staff01',
      fullName: 'Nguyễn Văn A',
      email: 'staff01@dss-purchase.local',
      role: 'STAFF',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: new Date('2026-09-04T08:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: expect.any(Date),
    });
    expect(mockUserRepo.findById).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should throw EntityNotFoundException when user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(getProfileUseCase.execute('unknown-uuid')).rejects.toThrow(
      EntityNotFoundException
    );
  });
});
