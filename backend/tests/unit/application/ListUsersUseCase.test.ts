import { ListUsersUseCase } from '../../../src/application/use-cases/user/ListUsersUseCase';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { User } from '../../../src/domain/entities/User';

describe('ListUsersUseCase (UC-016 / FR-032)', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let listUsersUseCase: ListUsersUseCase;

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
    listUsersUseCase = new ListUsersUseCase(mockUserRepo);
  });

  it('should call repository with default pagination (page=1, limit=20, offset=0)', async () => {
    const user1 = new User({
      id: 'u-1',
      username: 'admin',
      passwordHash: 'secret_hash',
      fullName: 'Quản Trị Viên',
      email: 'admin@dss.vn',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    });

    mockUserRepo.findAll.mockResolvedValue({
      users: [user1],
      total: 1,
    });

    const result = await listUsersUseCase.execute();

    expect(mockUserRepo.findAll).toHaveBeenCalledWith({
      isActive: undefined,
      role: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.users).toHaveLength(1);
    expect(result.users[0].id).toBe('u-1');
    expect(result.users[0].username).toBe('admin');
    expect(result.users[0].fullName).toBe('Quản Trị Viên');
    expect(result.users[0].email).toBe('admin@dss.vn');
    expect(result.users[0].role).toBe('ADMIN');
    expect((result.users[0] as any).passwordHash).toBeUndefined(); // Zero credential leakage
  });

  it('should correctly calculate offset for custom page and limit with filters', async () => {
    mockUserRepo.findAll.mockResolvedValue({
      users: [],
      total: 0,
    });

    await listUsersUseCase.execute({
      page: 3,
      limit: 15,
      role: 'STAFF',
      isActive: true,
      search: 'nguyen',
    });

    expect(mockUserRepo.findAll).toHaveBeenCalledWith({
      isActive: true,
      role: 'STAFF',
      search: 'nguyen',
      limit: 15,
      offset: 30, // (3 - 1) * 15 = 30
    });
  });

  it('should clamp limit to max 100 and min 1', async () => {
    mockUserRepo.findAll.mockResolvedValue({
      users: [],
      total: 0,
    });

    await listUsersUseCase.execute({
      page: 1,
      limit: 500, // Exceeds max 100
    });

    expect(mockUserRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
        offset: 0,
      })
    );
  });
});
