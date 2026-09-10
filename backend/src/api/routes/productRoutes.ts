import { Router } from 'express';
import { productController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  skuParamSchema,
  updateProductStatusSchema,
} from '../validations/productValidations';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(productFilterSchema), catchAsync(productController.listProducts));
router.get('/categories', catchAsync(productController.getCategories));

// Product 360 Analysis (UC-006)
router.get('/:sku/360', validateParams(skuParamSchema), catchAsync(productController.getProduct360));

router.get('/:sku', validateParams(skuParamSchema), catchAsync(productController.getProductBySku));

// Admin-only mutation routes
router.post(
  '/',
  rbacMiddleware(['ADMIN']),
  validateBody(createProductSchema),
  catchAsync(productController.createProduct)
);

router.patch(
  '/:sku',
  rbacMiddleware(['ADMIN']),
  validateParams(skuParamSchema),
  validateBody(updateProductSchema),
  catchAsync(productController.updateProduct)
);

// PATCH /:sku/status (Docs 2.3 / UC-001 / BR-021)
router.patch(
  '/:sku/status',
  rbacMiddleware(['ADMIN']),
  validateParams(skuParamSchema),
  validateBody(updateProductStatusSchema),
  catchAsync(productController.updateProductStatus)
);

export default router;
