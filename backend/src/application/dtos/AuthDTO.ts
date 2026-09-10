import { UserRole } from '../../domain/entities/User';

export interface LoginRequestDTO {
  username: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    mustChangePassword: boolean;
  };
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}


export interface CreateUserRequestDTO {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role?: UserRole;
}

export interface UpdateUserRequestDTO {
  fullName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface UserResponseDTO {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMeResponseDTO {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface ResetPasswordRequestDTO {
  newPassword?: string;
}

export interface ResetPasswordResponseDTO {
  id: string;
  username: string;
  mustChangePassword: boolean;
  temporaryPassword?: string;
  message: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}


