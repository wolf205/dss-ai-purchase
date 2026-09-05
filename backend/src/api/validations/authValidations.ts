import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string({ required_error: 'Tên đăng nhập không được để trống' }).min(1, 'Tên đăng nhập không được để trống'),
  password: z.string({ required_error: 'Mật khẩu không được để trống' }).min(1, 'Mật khẩu không được để trống'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token không được để trống' }).min(1, 'Refresh token không được để trống'),
});

export const createUserSchema = z.object({
  username: z.string({ required_error: 'Tên đăng nhập không được để trống' }).min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50),
  password: z.string({ required_error: 'Mật khẩu không được để trống' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string({ required_error: 'Họ tên không được để trống' }).min(1, 'Họ tên không được để trống').max(100),
  email: z.string({ required_error: 'Email không được để trống' }).email('Email không đúng định dạng'),
  role: z.enum(['ADMIN', 'STAFF'], { invalid_type_error: 'Vai trò phải là ADMIN hoặc STAFF' }).default('STAFF'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(100).optional(),
  email: z.string().email('Email không đúng định dạng').optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').optional(),
});
