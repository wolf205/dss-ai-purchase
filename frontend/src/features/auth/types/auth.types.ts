export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
