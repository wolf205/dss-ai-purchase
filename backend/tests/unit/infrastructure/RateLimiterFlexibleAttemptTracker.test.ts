import { RateLimiterFlexibleAttemptTracker } from '../../../src/infrastructure/security/RateLimiterFlexibleAttemptTracker';

describe('RateLimiterFlexibleAttemptTracker (rate-limiter-flexible Adapter)', () => {
  let tracker: RateLimiterFlexibleAttemptTracker;

  beforeEach(() => {
    // 5 attempts, 15 minutes lockout, 15 minutes window
    tracker = new RateLimiterFlexibleAttemptTracker(5, 15, 15);
  });

  it('should not be blocked initially', async () => {
    const isBlocked = await tracker.isBlocked('admin');
    expect(isBlocked).toBe(false);

    const remainingSec = await tracker.getRemainingLockSeconds('admin');
    expect(remainingSec).toBe(0);
  });

  it('should block after 5 failed attempts within the 15-minute window', async () => {
    for (let i = 1; i <= 4; i++) {
      await tracker.recordFailedAttempt('admin');
      const isBlocked = await tracker.isBlocked('admin');
      expect(isBlocked).toBe(false);
    }

    // 5th attempt triggers lockout
    await tracker.recordFailedAttempt('admin');
    const isBlockedAfter5 = await tracker.isBlocked('admin');
    expect(isBlockedAfter5).toBe(true);

    const remainingSec = await tracker.getRemainingLockSeconds('admin');
    expect(remainingSec).toBeGreaterThan(0);
  });

  it('should be case-insensitive for username/identifier', async () => {
    for (let i = 1; i <= 4; i++) {
      await tracker.recordFailedAttempt('Admin');
    }
    await tracker.recordFailedAttempt('ADMIN');

    const isBlocked = await tracker.isBlocked('admin');
    expect(isBlocked).toBe(true);
  });

  it('should reset attempts on successful login', async () => {
    for (let i = 1; i <= 3; i++) {
      await tracker.recordFailedAttempt('admin');
    }
    await tracker.resetAttempts('admin');

    const isBlocked = await tracker.isBlocked('admin');
    expect(isBlocked).toBe(false);

    // After reset, 4 more attempts should not trigger lockout
    for (let i = 1; i <= 4; i++) {
      await tracker.recordFailedAttempt('admin');
    }
    const isBlockedAfter4 = await tracker.isBlocked('admin');
    expect(isBlockedAfter4).toBe(false);
  });
});
