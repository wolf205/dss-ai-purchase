import { Router } from 'express';
import { DataImportController } from '../controllers/DataImportController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/sales-inventory',
  uploadMiddleware.single('file'),
  DataImportController.uploadSalesAndInventory
);

router.get('/logs', DataImportController.getImportLogs);
router.get('/logs/:id', DataImportController.getImportLogById);

export default router;
