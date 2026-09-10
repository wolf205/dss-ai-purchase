import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z
    .string({ required_error: 'Mã SKU không được để trống' })
    .trim()
    .toUpperCase()
    .min(2, 'Mã SKU phải có ít nhất 2 ký tự')
    .max(50, 'Mã SKU không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã SKU chỉ được chứa chữ cái, chữ số, gạch nối (-) hoặc gạch dưới (_)'),
  name: z
    .string({ required_error: 'Tên sản phẩm không được để trống' })
    .trim()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(255),
  category: z
    .string({ required_error: 'Danh mục không được để trống' })
    .trim()
    .min(1, 'Danh mục không được để trống')
    .max(100),
  unit: z
    .string({ required_error: 'Đơn vị tính không được để trống' })
    .trim()
    .min(1, 'Đơn vị tính không được để trống')
    .max(50),
  costPrice: z
    .number({ required_error: 'Giá vốn không được để trống' })
    .gt(0, 'Giá vốn phải lớn hơn 0'),
  sellingPrice: z
    .number({ required_error: 'Giá bán không được để trống' })
    .gt(0, 'Giá bán phải lớn hơn 0'),
  defaultLeadTime: z
    .number()
    .int('Thời gian giao hàng phải là số nguyên')
    .min(1, 'Thời gian giao hàng mặc định phải >= 1 ngày')
    .default(1),
  minSafetyStock: z
    .number()
    .int('Tồn kho an toàn phải là số nguyên')
    .min(0, 'Tồn kho an toàn tối thiểu không được âm')
    .default(0),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Tên sản phẩm không được để trống').max(255).optional(),
  category: z.string().trim().min(1, 'Danh mục không được để trống').max(100).optional(),
  unit: z.string().trim().min(1, 'Đơn vị tính không được để trống').max(50).optional(),
  costPrice: z.number().gt(0, 'Giá vốn phải lớn hơn 0').optional(),
  sellingPrice: z.number().gt(0, 'Giá bán phải lớn hơn 0').optional(),
  defaultLeadTime: z.number().int('Thời gian giao hàng phải là số nguyên').min(1, 'Thời gian giao hàng phải >= 1 ngày').optional(),
  minSafetyStock: z.number().int('Tồn kho an toàn phải là số nguyên').min(0, 'Tồn kho an toàn tối thiểu không được âm').optional(),
  isActive: z.boolean().optional(),
});

export const productFilterSchema = z.object({
  category: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  search: z.string().trim().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? 1 : Number(val)))
    .pipe(
      z
        .number({ invalid_type_error: 'Số trang phải là số hợp lệ' })
        .int('Số trang phải là số nguyên')
        .min(1, 'Số trang phải >= 1')
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? 20 : Number(val)))
    .pipe(
      z
        .number({ invalid_type_error: 'Số lượng mỗi trang phải là số hợp lệ' })
        .int('Số lượng mỗi trang phải là số nguyên')
        .min(1, 'Số lượng mỗi trang phải >= 1')
        .max(100, 'Số lượng mỗi trang không được vượt quá 100')
    ),
  sortBy: z
    .enum(['sku', 'name', 'category', 'costPrice', 'sellingPrice', 'createdAt'])
    .default('sku'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const skuParamSchema = z.object({
  sku: z
    .string({ required_error: 'Mã SKU không được để trống' })
    .min(2, 'Mã SKU phải có ít nhất 2 ký tự')
    .max(50, 'Mã SKU không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã SKU chỉ được chứa chữ cái, chữ số, gạch nối (-) hoặc gạch dưới (_)'),
});

export const updateProductStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'Trạng thái isActive là bắt buộc và phải là kiểu boolean' }),
});
