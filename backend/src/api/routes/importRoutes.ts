import { Router } from 'express';
import { dataImportController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validateMiddleware';
import {
  uploadDataImportSchema,
  importTemplateParamsSchema,
  importTemplateQuerySchema,
} from '../validations/importValidations';
import { catchAsync } from '../middlewares/catchAsync';

const router = Router();

router.use(authMiddleware);

// GET /templates/:type (Docs 2.5 - UC-003)
router.get(
  '/templates/:type',
  rbacMiddleware(['ADMIN', 'STAFF']),
  validateParams(importTemplateParamsSchema),
  validateQuery(importTemplateQuerySchema),
  catchAsync(dataImportController.getTemplate)
);

// POST /upload (Docs 2.4) & legacy /sales-inventory
router.post(
  '/upload',
  uploadMiddleware.single('file'),
  validateBody(uploadDataImportSchema),
  catchAsync(dataImportController.uploadSalesAndInventory)
);

router.post(
  '/sales-inventory',
  uploadMiddleware.single('file'),
  validateBody(uploadDataImportSchema),
  catchAsync(dataImportController.uploadSalesAndInventory)
);

router.get('/logs', catchAsync(dataImportController.getImportLogs));
router.get('/logs/:id', catchAsync(dataImportController.getImportLogById));

export default router;
