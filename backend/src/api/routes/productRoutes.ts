import { Router } from 'express';
import { productController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from '../validations/productValidations';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(productFilterSchema), catchAsync(productController.listProducts));
router.get('/categories', catchAsync(productController.getCategories));

// Product 360 Analysis (UC-006)
router.get('/:sku/360', catchAsync(productController.getProduct360));

router.get('/:sku', catchAsync(productController.getProductBySku));

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
  validateBody(updateProductSchema),
  catchAsync(productController.updateProduct)
);

// PATCH /:sku/status (Docs 2.3)
router.patch(
  '/:sku/status',
  rbacMiddleware(['ADMIN']),
  validateBody(updateProductSchema),
  catchAsync(productController.updateProduct)
);

export default router;
