import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z
    .string({ required_error: 'Mã SKU không được để trống' })
    .min(2, 'Mã SKU phải có ít nhất 2 ký tự')
    .max(50, 'Mã SKU không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã SKU chỉ được chứa chữ cái, chữ số, gạch nối (-) hoặc gạch dưới (_)'),
  name: z.string({ required_error: 'Tên sản phẩm không được để trống' }).min(1, 'Tên sản phẩm không được để trống').max(255),
  category: z.string({ required_error: 'Danh mục không được để trống' }).min(1, 'Danh mục không được để trống').max(100),
  unit: z.string({ required_error: 'Đơn vị tính không được để trống' }).min(1, 'Đơn vị tính không được để trống').max(50),
  costPrice: z.number({ required_error: 'Giá vốn không được để trống' }).min(0, 'Giá vốn không được âm'),
  sellingPrice: z.number({ required_error: 'Giá bán không được để trống' }).min(0, 'Giá bán không được âm'),
  defaultLeadTime: z.number().int().min(1, 'Thời gian giao hàng mặc định phải >= 1 ngày').default(1),
  minSafetyStock: z.number().int().min(0, 'Tồn kho an toàn tối thiểu không được âm').default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(255).optional(),
  category: z.string().min(1, 'Danh mục không được để trống').max(100).optional(),
  unit: z.string().min(1, 'Đơn vị tính không được để trống').max(50).optional(),
  costPrice: z.number().min(0, 'Giá vốn không được âm').optional(),
  sellingPrice: z.number().min(0, 'Giá bán không được âm').optional(),
  defaultLeadTime: z.number().int().min(1, 'Thời gian giao hàng phải >= 1 ngày').optional(),
  minSafetyStock: z.number().int().min(0, 'Tồn kho an toàn tối thiểu không được âm').optional(),
  isActive: z.boolean().optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});
