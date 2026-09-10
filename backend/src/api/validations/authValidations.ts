import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string({ required_error: 'Tên đăng nhập không được để trống' }).min(1, 'Tên đăng nhập không được để trống'),
  password: z.string({ required_error: 'Mật khẩu không được để trống' }).min(1, 'Mật khẩu không được để trống'),
});

export const createUserSchema = z.object({
  username: z
    .string({ required_error: 'Tên đăng nhập không được để trống' })
    .trim()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang hoặc dấu chấm (không chứa khoảng trắng)'
    ),
  password: z
    .string({ required_error: 'Mật khẩu không được để trống' })
    .min(8, 'Mật khẩu khởi tạo phải có ít nhất 8 ký tự'),
  fullName: z
    .string({ required_error: 'Họ tên không được để trống' })
    .trim()
    .min(1, 'Họ tên không được để trống')
    .max(100),
  email: z
    .string({ required_error: 'Email không được để trống' })
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng'),
  role: z
    .enum(['ADMIN', 'STAFF'], { invalid_type_error: 'Vai trò phải là ADMIN hoặc STAFF' })
    .default('STAFF'),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Họ tên không được để trống').max(100).optional(),
    email: z.string().trim().toLowerCase().email('Email không đúng định dạng').optional(),
    role: z
      .enum(['ADMIN', 'STAFF'], { invalid_type_error: 'Vai trò phải là ADMIN hoặc STAFF' })
      .optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Phải cung cấp ít nhất một trường thông tin để cập nhật',
  });

export const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: 'Mật khẩu hiện tại không được để trống' }).min(1),
  newPassword: z.string({ required_error: 'Mật khẩu mới không được để trống' }).min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'Trạng thái kích hoạt (isActive) không được để trống',
    invalid_type_error: 'Trạng thái kích hoạt (isActive) phải là kiểu boolean (true hoặc false)',
  }),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự').optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['ADMIN', 'STAFF'], { invalid_type_error: 'Vai trò phải là ADMIN hoặc STAFF' }).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().trim().max(100).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Mã định danh người dùng (ID) phải là định dạng UUID hợp lệ'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh Token không được để trống' }).min(1, 'Refresh Token không được để trống'),
});





