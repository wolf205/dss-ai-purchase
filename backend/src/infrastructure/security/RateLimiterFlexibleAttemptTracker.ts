import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ILoginAttemptTracker } from '../../application/ports/ILoginAttemptTracker';

/**
 * Layer 2 Defense: Business Brute-force Attempt Tracker (Infrastructure Adapter).
 * Uses rate-limiter-flexible with in-memory storage (auto TTL/LRU eviction).
 * Implements ILoginAttemptTracker port to keep Domain/Application layers 100% pure.
 */
export class RateLimiterFlexibleAttemptTracker implements ILoginAttemptTracker {
  private readonly limiter: RateLimiterMemory;
  private readonly maxAttempts: number;
  private readonly lockoutDurationSeconds: number;

  constructor(
    maxAttempts: number = 5,
    lockoutDurationMinutes: number = 15,
    windowDurationMinutes: number = 15
  ) {
    this.maxAttempts = maxAttempts;
    this.lockoutDurationSeconds = lockoutDurationMinutes * 60;
    const windowDurationSeconds = windowDurationMinutes * 60;

    this.limiter = new RateLimiterMemory({
      points: maxAttempts,
      duration: windowDurationSeconds,
      blockDuration: this.lockoutDurationSeconds,
    });
  }

  public async isBlocked(identifier: string): Promise<boolean> {
    try {
      const res = await this.limiter.get(identifier.toLowerCase());
      if (!res) return false;
      return res.remainingPoints <= 0 || res.consumedPoints >= this.maxAttempts;
    } catch {
      return false;
    }
  }

  public async recordFailedAttempt(identifier: string): Promise<void> {
    const key = identifier.toLowerCase();
    try {
      const res = await this.limiter.consume(key, 1);
      if (res.consumedPoints >= this.maxAttempts) {
        await this.limiter.block(key, this.lockoutDurationSeconds);
      }
    } catch {
      // If consume rejects, threshold was exceeded: ensure key is explicitly blocked
      await this.limiter.block(key, this.lockoutDurationSeconds);
    }
  }

  public async resetAttempts(identifier: string): Promise<void> {
    await this.limiter.delete(identifier.toLowerCase());
  }

  public async getRemainingLockSeconds(identifier: string): Promise<number> {
    try {
      const res = await this.limiter.get(identifier.toLowerCase());
      if (!res || res.remainingPoints > 0) return 0;
      return Math.ceil(res.msBeforeNext / 1000);
    } catch {
      return 0;
    }
  }
}
