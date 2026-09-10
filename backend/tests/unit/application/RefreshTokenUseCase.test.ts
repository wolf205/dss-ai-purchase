import { RefreshTokenUseCase } from '../../../src/application/use-cases/auth/RefreshTokenUseCase';
import { IRefreshTokenRepository, RefreshTokenEntity } from '../../../src/domain/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';

import { ITokenService } from '../../../src/application/ports/ITokenService';
import { ITokenBlacklistService } from '../../../src/application/ports/ITokenBlacklistService';
import { UnauthorizedException } from '../../../src/application/exceptions';
import { User } from '../../../src/domain/entities/User';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockTokenBlacklistService: jest.Mocked<ITokenBlacklistService>;

  const mockUser = new User({
    id: 'user-uuid-1',
    username: 'staff01',
    passwordHash: 'hashed_pw',
    fullName: 'Nhân Viên 1',
    email: 'staff01@example.com',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
  });

  beforeEach(() => {
    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue({
        accessToken: 'new.access.token',
        expiresIn: 900,
      }),
      generateRefreshToken: jest.fn().mockReturnValue('new-raw-refresh-token-64hex'),
      hashToken: jest.fn().mockImplementation((token: string) => `hashed_${token}`),
      verifyAccessToken: jest.fn(),
    };

    mockTokenBlacklistService = {
      revoke: jest.fn(),
      isRevoked: jest.fn().mockReturnValue(false),
      revokeUser: jest.fn(),
      unrevokeUser: jest.fn(),
      isUserRevoked: jest.fn().mockReturnValue(false),
      revokeUserTokensBefore: jest.fn(),
      isTokenIssuedBeforeRevocation: jest.fn().mockReturnValue(false),
    };

    useCase = new RefreshTokenUseCase(
      mockRefreshTokenRepo,
      mockUserRepo,
      mockTokenService,
      mockTokenBlacklistService
    );
  });

  it('should successfully rotate refresh token and issue new access token when valid', () => {
    const validEntity: RefreshTokenEntity = {
      id: 'rt-1',
      userId: 'user-uuid-1',
      tokenHash: 'hashed_raw-refresh-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in future
      revokedAt: null,
      createdAt: new Date(),
    };
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(validEntity);

    return useCase
      .execute({
        refreshToken: 'raw-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })
      .then((result) => {
        expect(result.accessToken).toBe('new.access.token');
        expect(result.expiresIn).toBe(900);
        expect(result.refreshToken).toBe('new-raw-refresh-token-64hex');

        // Verify rotation
        expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith(
          'hashed_raw-refresh-token',
          'hashed_new-raw-refresh-token-64hex'
        );
        expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-uuid-1',
            tokenHash: 'hashed_new-raw-refresh-token-64hex',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
          })
        );
      });
  });

  it('should throw REFRESH_TOKEN_INVALID when token does not exist in database', async () => {
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'non-existent-token' })
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      useCase.execute({ refreshToken: 'non-existent-token' })
    ).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    });
  });

  it('should detect Token Reuse / Theft and revoke all user tokens when a replaced token is reused', async () => {
    const stolenReusedEntity: RefreshTokenEntity = {
      id: 'rt-stolen',
      userId: 'user-uuid-1',
      tokenHash: 'hashed_stolen-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: new Date(Date.now() - 60000), // Already revoked 1 minute ago
      replacedByTokenHash: 'hashed_subsequent-valid-token',
      createdAt: new Date(),
    };
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(stolenReusedEntity);

    await expect(
      useCase.execute({ refreshToken: 'stolen-token' })
    ).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
      message: expect.stringContaining('Phát hiện dấu hiệu chiếm đoạt phiên làm việc'),
    });

    // Verify all sessions were revoked for user safety
    expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should throw REFRESH_TOKEN_EXPIRED when token has expired', async () => {
    const expiredEntity: RefreshTokenEntity = {
      id: 'rt-expired',
      userId: 'user-uuid-1',
      tokenHash: 'hashed_expired-token',
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      revokedAt: null,
      createdAt: new Date(),
    };
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(expiredEntity);

    await expect(
      useCase.execute({ refreshToken: 'expired-token' })
    ).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
    });
  });

  it('should throw ACCOUNT_LOCKED when user has been deactivated', async () => {
    const validEntity: RefreshTokenEntity = {
      id: 'rt-valid',
      userId: 'user-uuid-locked',
      tokenHash: 'hashed_valid-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    };
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(validEntity);

    const deactivatedUser = new User({
      id: 'user-uuid-locked',
      username: 'locked_user',
      passwordHash: 'hashed_pw',
      fullName: 'Khóa',
      email: 'locked@example.com',
      role: 'STAFF',
      isActive: false,
      mustChangePassword: false,
    });
    mockUserRepo.findById.mockResolvedValue(deactivatedUser);

    await expect(
      useCase.execute({ refreshToken: 'valid-token' })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    });
  });
});
