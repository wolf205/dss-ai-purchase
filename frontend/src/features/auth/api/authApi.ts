import apiClient from '../../../lib/axios';
import {
  LoginCredentials,
  LoginResponseData,
  RefreshTokenResponseData,
  User,
  ChangePasswordPayload,
} from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponseData }>('/auth/login', credentials);
    return res.data.data;
  },

  refreshToken: async (token: string): Promise<RefreshTokenResponseData> => {
    const res = await apiClient.post<{ success: boolean; data: RefreshTokenResponseData }>('/auth/refresh', {
      refreshToken: token,
    });
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return res.data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { message: string } }>('/auth/change-password', payload);
    return res.data.data;
  },

  logout: async (refreshToken?: string | null): Promise<{ message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { message: string } }>('/auth/logout', {
      refreshToken: refreshToken || undefined,
    });
    return res.data.data;
  },
};

export default authApi;

