import { LogoutUseCase } from '../../../src/application/use-cases/auth/LogoutUseCase';
import { ITokenBlacklistService } from '../../../src/application/ports/ITokenBlacklistService';
import { ValidationException } from '../../../src/application/exceptions';

describe('LogoutUseCase (UC-015 Flow A3)', () => {
  let mockBlacklistService: jest.Mocked<ITokenBlacklistService>;
  let logoutUseCase: LogoutUseCase;

  beforeEach(() => {
    mockBlacklistService = {
      revoke: jest.fn().mockResolvedValue(undefined),
      isRevoked: jest.fn().mockResolvedValue(false),
    };
    logoutUseCase = new LogoutUseCase(mockBlacklistService);
  });

  it('should successfully revoke token and return success message', async () => {
    const fakeToken = 'valid.jwt.token.string';
    const result = await logoutUseCase.execute(fakeToken);

    expect(result).toEqual({
      message: 'Đăng xuất thành công.',
    });
    expect(mockBlacklistService.revoke).toHaveBeenCalledWith(fakeToken, 900);
  });

  it('should revoke refresh token in repository if refreshToken is provided', async () => {
    const mockRefreshRepo = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn(),
    };
    const mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn().mockReturnValue('hashed-rt'),
      verifyAccessToken: jest.fn(),
    };

    const useCaseWithRefresh = new LogoutUseCase(mockBlacklistService, mockRefreshRepo, mockTokenService);
    await useCaseWithRefresh.execute('valid.token', 'valid.refresh.token');

    expect(mockBlacklistService.revoke).toHaveBeenCalledWith('valid.token', 900);
    expect(mockTokenService.hashToken).toHaveBeenCalledWith('valid.refresh.token');
    expect(mockRefreshRepo.revoke).toHaveBeenCalledWith('hashed-rt');
  });

  it('should throw ValidationException when token is empty or whitespace', async () => {
    await expect(logoutUseCase.execute('')).rejects.toThrow(ValidationException);
    await expect(logoutUseCase.execute('   ')).rejects.toThrow(ValidationException);
    expect(mockBlacklistService.revoke).not.toHaveBeenCalled();
  });

});
