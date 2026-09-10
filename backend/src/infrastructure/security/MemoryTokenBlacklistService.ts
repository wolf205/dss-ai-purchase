import { ITokenBlacklistService } from '../../application/ports/ITokenBlacklistService';

/**
 * Infrastructure Adapter: In-Memory Token Blacklist with TTL cleanup.
 * Implements ITokenBlacklistService to store revoked JWT tokens in RAM without external dependencies.
 * Automatically evicts expired tokens on lookup to prevent memory leaks.
 */
export class MemoryTokenBlacklistService implements ITokenBlacklistService {
  private readonly blacklist = new Map<string, number>();
  private readonly userBlacklist = new Set<string>();

  public revoke(token: string, ttlSeconds: number = 28800): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.blacklist.set(token, expiresAt);
  }

  public isRevoked(token: string): boolean {
    const expiresAt = this.blacklist.get(token);
    if (!expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  public revokeUser(userId: string): void {
    this.userBlacklist.add(userId);
  }

  public unrevokeUser(userId: string): void {
    this.userBlacklist.delete(userId);
  }

  public isUserRevoked(userId: string): boolean {
    return this.userBlacklist.has(userId);
  }

  private readonly userRevokedBefore = new Map<string, number>();

  public revokeUserTokensBefore(userId: string, timestampMs: number = Date.now()): void {
    this.userRevokedBefore.set(userId, timestampMs);
  }

  public isTokenIssuedBeforeRevocation(userId: string, tokenIatSeconds?: number): boolean {
    if (!tokenIatSeconds) return false;
    const revokedBefore = this.userRevokedBefore.get(userId);
    if (!revokedBefore) return false;
    return (tokenIatSeconds * 1000) < revokedBefore;
  }

  public clear(): void {
    this.blacklist.clear();
    this.userBlacklist.clear();
    this.userRevokedBefore.clear();
  }

  public get size(): number {
    this.cleanExpired();
    return this.blacklist.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.blacklist.entries()) {
      if (now > expiresAt) {
        this.blacklist.delete(token);
      }
    }
  }
}
