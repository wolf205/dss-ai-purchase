import { MemoryTokenBlacklistService } from '../../../src/infrastructure/security/MemoryTokenBlacklistService';

describe('MemoryTokenBlacklistService', () => {
  let blacklistService: MemoryTokenBlacklistService;

  beforeEach(() => {
    jest.useFakeTimers();
    blacklistService = new MemoryTokenBlacklistService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not report a token as revoked if never added', () => {
    expect(blacklistService.isRevoked('unrevoked_token')).toBe(false);
  });

  it('should report a token as revoked after calling revoke', () => {
    blacklistService.revoke('token_123', 900); // 15 mins TTL
    expect(blacklistService.isRevoked('token_123')).toBe(true);
    expect(blacklistService.size).toBe(1);
  });

  it('should automatically unblock token when TTL expires', () => {
    blacklistService.revoke('token_123', 60); // 60 seconds TTL
    expect(blacklistService.isRevoked('token_123')).toBe(true);

    // Advance time by 61 seconds
    jest.advanceTimersByTime(61 * 1000);

    expect(blacklistService.isRevoked('token_123')).toBe(false);
    expect(blacklistService.size).toBe(0);
  });

  it('should clear all tokens and user revocations on clear()', () => {
    blacklistService.revoke('t1', 1000);
    blacklistService.revoke('t2', 1000);
    blacklistService.revokeUser('u1');
    blacklistService.revokeUserTokensBefore('u2', Date.now());
    expect(blacklistService.size).toBe(2);

    blacklistService.clear();
    expect(blacklistService.size).toBe(0);
    expect(blacklistService.isRevoked('t1')).toBe(false);
    expect(blacklistService.isUserRevoked('u1')).toBe(false);
    expect(blacklistService.isTokenIssuedBeforeRevocation('u2', Math.floor(Date.now() / 1000))).toBe(false);
  });

  it('should correctly handle revokeUser and unrevokeUser', () => {
    expect(blacklistService.isUserRevoked('user_abc')).toBe(false);
    blacklistService.revokeUser('user_abc');
    expect(blacklistService.isUserRevoked('user_abc')).toBe(true);
    blacklistService.unrevokeUser('user_abc');
    expect(blacklistService.isUserRevoked('user_abc')).toBe(false);
  });

  it('should report token as revoked if token iat is before revocation timestamp', () => {
    const changePasswordTime = 1700000000 * 1000; // ms
    blacklistService.revokeUserTokensBefore('user_123', changePasswordTime);

    // Token issued before password change (e.g. 10 seconds before)
    const oldTokenIat = 1700000000 - 10; // seconds
    expect(blacklistService.isTokenIssuedBeforeRevocation('user_123', oldTokenIat)).toBe(true);

    // Token issued after password change (e.g. 10 seconds after)
    const newTokenIat = 1700000000 + 10; // seconds
    expect(blacklistService.isTokenIssuedBeforeRevocation('user_123', newTokenIat)).toBe(false);

    // User not in revocation map
    expect(blacklistService.isTokenIssuedBeforeRevocation('other_user', oldTokenIat)).toBe(false);
  });
});
