export interface ITokenBlacklistService {
  revoke(token: string, ttlSeconds?: number): Promise<void> | void;
  isRevoked(token: string): Promise<boolean> | boolean;
  revokeUser?(userId: string): Promise<void> | void;
  unrevokeUser?(userId: string): Promise<void> | void;
  isUserRevoked?(userId: string): Promise<boolean> | boolean;
  revokeUserTokensBefore?(userId: string, timestampMs?: number): Promise<void> | void;
  isTokenIssuedBeforeRevocation?(userId: string, tokenIatSeconds?: number): Promise<boolean> | boolean;
}
