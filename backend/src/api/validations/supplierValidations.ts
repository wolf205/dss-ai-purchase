import { z } from 'zod';

export const supplierIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Mã định danh nhà cung cấp không được để trống' })
    .regex(/^[1-9]\d*$/, 'Mã định danh nhà cung cấp phải là số nguyên dương hợp lệ'),
});

export const createSupplierSchema = z.object({
  code: z
    .string({ required_error: 'Mã nhà cung cấp không được để trống' })
    .trim()
    .toUpperCase()
    .min(2, 'Mã nhà cung cấp phải có ít nhất 2 ký tự')
    .max(50, 'Mã nhà cung cấp không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã nhà cung cấp chỉ được chứa chữ cái, chữ số, gạch nối (-) hoặc gạch dưới (_)'),
  name: z
    .string({ required_error: 'Tên nhà cung cấp không được để trống' })
    .trim()
    .min(1, 'Tên nhà cung cấp không được để trống')
    .max(255, 'Tên nhà cung cấp không được vượt quá 255 ký tự'),
  phone: z
    .string({ required_error: 'Số điện thoại không được để trống' })
    .trim()
    .min(8, 'Số điện thoại phải có ít nhất 8 ký tự')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .regex(/^[0-9+() -]{8,20}$/, 'Số điện thoại chứa ký tự không hợp lệ'),
  email: z
    .string()
    .trim()
    .email('Email không đúng định dạng')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  statusTag: z.enum(['NEW_SUPPLIER', 'ACTIVE']).default('NEW_SUPPLIER'),
});

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Tên nhà cung cấp không được để trống').max(255).optional(),
  phone: z
    .string()
    .trim()
    .min(8, 'Số điện thoại phải có ít nhất 8 ký tự')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .regex(/^[0-9+() -]{8,20}$/, 'Số điện thoại chứa ký tự không hợp lệ')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Email không đúng định dạng')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  statusTag: z.enum(['NEW_SUPPLIER', 'ACTIVE']).optional(),
  isActive: z.boolean().optional(),
});

export const supplierFilterSchema = z.object({
  statusTag: z
    .enum(['NEW_SUPPLIER', 'ACTIVE'], {
      errorMap: () => ({ message: 'statusTag phải là NEW_SUPPLIER hoặc ACTIVE' }),
    })
    .optional(),
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
  sortBy: z.enum(['code', 'name', 'createdAt']).default('code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const productSupplierTermsSchema = z.object({
  productSku: z.string({ required_error: 'Mã SKU không được để trống' }).trim().min(1, 'Mã SKU không được để trống'),
  supplierId: z.string().optional(),
  purchasePrice: z.number({ required_error: 'Giá nhập không được để trống' }).positive('Giá nhập phải lớn hơn 0'),
  moq: z.number().int().min(1, 'MOQ phải >= 1').default(1),
  packSize: z.number().int().min(1, 'Quy cách đóng gói phải >= 1').default(1),
  committedLeadTime: z.number().int().min(1, 'Thời gian giao hàng cam kết phải >= 1 ngày').default(1),
  isPreferred: z.boolean().default(false),
});

export const updateSupplierWeightsSchema = z
  .object({
    weightPrice: z.number({ required_error: 'Trọng số Giá cả không được để trống' }).min(0, 'Trọng số không được âm'),
    weightOtif: z.number({ required_error: 'Trọng số OTIF không được để trống' }).min(0, 'Trọng số không được âm'),
    weightQuality: z.number({ required_error: 'Trọng số Chất lượng không được để trống' }).min(0, 'Trọng số không được âm'),
    weightLeadTime: z.number().min(0, 'Trọng số không được âm').optional(),
    weightLeadtime: z.number().min(0, 'Trọng số không được âm').optional(),
  })
  .refine(
    (data) => data.weightLeadTime !== undefined || data.weightLeadtime !== undefined,
    { message: 'Trọng số Lead Time không được để trống', path: ['weightLeadTime'] }
  )
  .transform((data) => ({
    weightPrice: data.weightPrice,
    weightOtif: data.weightOtif,
    weightQuality: data.weightQuality,
    weightLeadTime: data.weightLeadTime ?? data.weightLeadtime ?? 0,
  }));

export const supplierDeliveriesQuerySchema = z.object({
  limit: z.coerce
    .number({ invalid_type_error: 'Số lượng đợt giao phải là số' })
    .int('Số lượng đợt giao phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1')
    .max(100, 'Số lượng tối đa là 100')
    .default(10),
});


