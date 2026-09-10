export interface ILoginAttemptTracker {
  isBlocked(identifier: string): Promise<boolean> | boolean;
  recordFailedAttempt(identifier: string): Promise<void> | void;
  resetAttempts(identifier: string): Promise<void> | void;
  getRemainingLockSeconds(identifier: string): Promise<number> | number;
}
