import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  promisedDeliveryDate: z.string().datetime({ message: 'Ngày hẹn giao hàng không hợp lệ' }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productSku: z.string().min(1, 'SKU không được để trống'),
      orderedQuantity: z.number().int().positive('Số lượng đặt mua phải lớn hơn 0'),
      unitPrice: z.number().nonnegative('Đơn giá không được âm')
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm')
});

export const getPurchaseOrdersSchema = z.object({
  supplierId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const poIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID không hợp lệ').transform((val) => BigInt(val))
});

export const cancelPurchaseOrderBodySchema = z.object({
  reason: z.string().min(1, 'Lý do hủy đơn không được để trống')
});

export const receiveGoodsBodySchema = z.object({
  actualDeliveryDate: z.string().datetime({ message: 'Ngày thực nhận không hợp lệ' }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productSku: z.string().min(1, 'SKU không được để trống'),
      deliveredQuantity: z.number().int().nonnegative('Số lượng giao không được âm'),
      defectiveQuantity: z.number().int().nonnegative('Số lượng lỗi không được âm')
    })
  ).min(1, 'Phải ghi nhận ít nhất 1 sản phẩm')
});
