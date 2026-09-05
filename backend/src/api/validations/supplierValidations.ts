import { z } from 'zod';

export const createSupplierSchema = z.object({
  code: z
    .string({ required_error: 'Mã nhà cung cấp không được để trống' })
    .min(2, 'Mã nhà cung cấp phải có ít nhất 2 ký tự')
    .max(50, 'Mã nhà cung cấp không được vượt quá 50 ký tự'),
  name: z.string({ required_error: 'Tên nhà cung cấp không được để trống' }).min(1, 'Tên nhà cung cấp không được để trống').max(255),
  phone: z.string({ required_error: 'Số điện thoại không được để trống' }).min(8, 'Số điện thoại không hợp lệ').max(20),
  email: z.string().email('Email không đúng định dạng').optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  statusTag: z.enum(['NEW_SUPPLIER', 'ACTIVE']).default('NEW_SUPPLIER'),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Tên nhà cung cấp không được để trống').max(255).optional(),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').max(20).optional(),
  email: z.string().email('Email không đúng định dạng').optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  statusTag: z.enum(['NEW_SUPPLIER', 'ACTIVE']).optional(),
  isActive: z.boolean().optional(),
});

export const supplierFilterSchema = z.object({
  statusTag: z.string().optional(),
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

export const productSupplierTermsSchema = z.object({
  productSku: z.string({ required_error: 'Mã SKU không được để trống' }).min(1),
  supplierId: z.string({ required_error: 'Mã nhà cung cấp ID không được để trống' }).min(1),
  purchasePrice: z.number({ required_error: 'Giá nhập không được để trống' }).min(0, 'Giá nhập không được âm'),
  moq: z.number().int().min(1, 'MOQ phải >= 1').default(1),
  packSize: z.number().int().min(1, 'Quy cách đóng gói phải >= 1').default(1),
  committedLeadTime: z.number().int().min(1, 'Thời gian giao hàng cam kết phải >= 1 ngày').default(1),
  isPreferred: z.boolean().default(false),
});

export const updateSupplierWeightsSchema = z.object({
  weightPrice: z.number({ required_error: 'Trọng số Giá cả không được để trống' }).min(0, 'Trọng số không được âm'),
  weightOtif: z.number({ required_error: 'Trọng số OTIF không được để trống' }).min(0, 'Trọng số không được âm'),
  weightQuality: z.number({ required_error: 'Trọng số Chất lượng không được để trống' }).min(0, 'Trọng số không được âm'),
  weightLeadTime: z.number({ required_error: 'Trọng số Lead Time không được để trống' }).min(0, 'Trọng số không được âm'),
});
