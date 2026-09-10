import { z } from 'zod';

export const uploadDataImportSchema = z.object({
  type: z
    .enum(['SALES_HISTORY', 'INVENTORY_SNAPSHOT'], {
      errorMap: () => ({ message: 'Loại nạp dữ liệu (type) phải là SALES_HISTORY hoặc INVENTORY_SNAPSHOT' }),
    })
    .optional(),
  importType: z
    .enum(['SALES_HISTORY', 'INVENTORY_SNAPSHOT'], {
      errorMap: () => ({ message: 'Loại nạp dữ liệu (importType) phải là SALES_HISTORY hoặc INVENTORY_SNAPSHOT' }),
    })
    .optional(),
  overwriteDuplicateDates: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return true;
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() !== 'false';
    }),
});

export type UploadDataImportDTO = z.infer<typeof uploadDataImportSchema>;

export const importTemplateParamsSchema = z.object({
  type: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(
      z.enum(['SALES_HISTORY', 'INVENTORY_SNAPSHOT', 'STOCK_INVENTORY'], {
        errorMap: () => ({
          message: 'Loại tệp tin mẫu (type) phải là SALES_HISTORY hoặc INVENTORY_SNAPSHOT (hoặc STOCK_INVENTORY)',
        }),
      })
    ),
});

export const importTemplateQuerySchema = z.object({
  format: z
    .string()
    .optional()
    .default('xlsx')
    .transform((val) => val.toLowerCase())
    .pipe(
      z.enum(['xlsx', 'csv'], {
        errorMap: () => ({
          message: 'Định dạng tệp tin mẫu (format) phải là xlsx hoặc csv',
        }),
      })
    ),
});

export type ImportTemplateParamsDTO = z.infer<typeof importTemplateParamsSchema>;
export type ImportTemplateQueryDTO = z.infer<typeof importTemplateQuerySchema>;

