import { UserRole } from '../../domain/entities/User';

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
}

export interface CreateUserRequestDTO {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
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
