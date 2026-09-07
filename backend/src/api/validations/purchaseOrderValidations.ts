import { z } from 'zod';

const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Định dạng ngày không hợp lệ (hỗ trợ YYYY-MM-DD hoặc ISO-8601)',
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  promisedDeliveryDate: dateStringSchema,
  notes: z.string().optional(),
  items: z
    .array(
      z
        .object({
          sku: z.string().optional(),
          productSku: z.string().optional(),
          orderedQuantity: z.number().int().positive('Số lượng đặt mua phải lớn hơn 0'),
          unitPrice: z.number().nonnegative('Đơn giá không được âm'),
        })
        .refine((data) => Boolean(data.sku || data.productSku), {
          message: 'Mã SKU không được để trống',
          path: ['sku'],
        })
        .transform((data) => ({
          productSku: data.productSku || data.sku || '',
          orderedQuantity: data.orderedQuantity,
          unitPrice: data.unitPrice,
        }))
    )
    .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});

export const getPurchaseOrdersSchema = z.object({
  supplierId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const poIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID không hợp lệ').transform((val) => BigInt(val)),
});

export const cancelPurchaseOrderBodySchema = z.object({
  reason: z.string().min(1, 'Lý do hủy đơn không được để trống'),
});

export const receiveGoodsBodySchema = z.object({
  actualDeliveryDate: dateStringSchema,
  notes: z.string().optional(),
  items: z
    .array(
      z
        .object({
          sku: z.string().optional(),
          productSku: z.string().optional(),
          deliveredQuantity: z.number().int().nonnegative('Số lượng giao không được âm'),
          defectiveQuantity: z.number().int().nonnegative('Số lượng lỗi không được âm'),
        })
        .refine((data) => Boolean(data.sku || data.productSku), {
          message: 'Mã SKU không được để trống',
          path: ['sku'],
        })
        .transform((data) => ({
          productSku: data.productSku || data.sku || '',
          deliveredQuantity: data.deliveredQuantity,
          defectiveQuantity: data.defectiveQuantity,
        }))
    )
    .min(1, 'Phải ghi nhận ít nhất 1 sản phẩm'),
});

