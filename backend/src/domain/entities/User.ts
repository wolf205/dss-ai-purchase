export type UserRole = 'ADMIN' | 'STAFF';

export interface UserProps {
  id?: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id?: string;
  public readonly username: string;
  private _passwordHash: string;
  private _fullName: string;
  private _email: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _mustChangePassword: boolean;
  private _lastLoginAt?: Date | null;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this._passwordHash = props.passwordHash;
    this._fullName = props.fullName;
    this._email = props.email;
    this._role = props.role;
    this._isActive = props.isActive;
    this._mustChangePassword = props.mustChangePassword;
    this._lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get email(): string {
    return this._email;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get mustChangePassword(): boolean {
    return this._mustChangePassword;
  }

  public get lastLoginAt(): Date | null | undefined {
    return this._lastLoginAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public isAdmin(): boolean {
    return this._role === 'ADMIN';
  }

  public updateProfile(fullName: string, email: string): void {
    if (!fullName.trim() || !email.trim()) {
      throw new Error('Họ tên và email không được để trống');
    }
    this._fullName = fullName.trim();
    this._email = email.trim();
    this._updatedAt = new Date();
  }

  public updateRole(role: UserRole): void {
    this._role = role;
    this._updatedAt = new Date();
  }

  public setActiveStatus(isActive: boolean): void {
    this._isActive = isActive;
    this._updatedAt = new Date();
  }

  public updatePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this._mustChangePassword = false;
    this._updatedAt = new Date();
  }

  public recordLogin(loginDate: Date = new Date()): void {
    this._lastLoginAt = loginDate;
    this._updatedAt = new Date();
  }
}
