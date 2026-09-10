import { GetProfileUseCase } from '../../../src/application/use-cases/auth/GetProfileUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { User } from '../../../src/domain/entities/User';
import { UnauthorizedException, ForbiddenException } from '../../../src/application/exceptions';

describe('GetProfileUseCase (UC-015, BR-021)', () => {
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

  it('should return UserMeResponseDTO when user exists and is active', async () => {
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
    });
    expect(mockUserRepo.findById).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should throw UnauthorizedException when user does not exist (token invalid/deleted)', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(getProfileUseCase.execute('unknown-uuid')).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should throw ForbiddenException with ACCOUNT_LOCKED when user account is deactivated (BR-021)', async () => {
    const lockedUser = new User({
      id: 'user-uuid-locked',
      username: 'staff02',
      passwordHash: 'hashed_pwd',
      fullName: 'Nguyễn Văn B',
      email: 'staff02@dss-purchase.local',
      role: 'STAFF',
      isActive: false, // Locked by Admin
      mustChangePassword: false,
    });

    mockUserRepo.findById.mockResolvedValue(lockedUser);

    await expect(getProfileUseCase.execute('user-uuid-locked')).rejects.toThrow(
      ForbiddenException
    );
  });
});
