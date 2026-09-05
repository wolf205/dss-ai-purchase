import { Router } from 'express';
import { dataImportController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { catchAsync } from '../middlewares/catchAsync';

const router = Router();

router.use(authMiddleware);

router.post(
  '/sales-inventory',
  uploadMiddleware.single('file'),
  catchAsync(dataImportController.uploadSalesAndInventory)
);

router.get('/logs', catchAsync(dataImportController.getImportLogs));
router.get('/logs/:id', catchAsync(dataImportController.getImportLogById));

export default router;
