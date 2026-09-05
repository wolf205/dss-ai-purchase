import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/octet-stream',
  ];

  const ext = file.originalname.toLowerCase();
  const isAllowedExt = ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv');

  if (allowedMimes.includes(file.mimetype) || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ. Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
