import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from '../validations/productValidations';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(productFilterSchema), ProductController.listProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:sku', ProductController.getProductBySku);

// Admin-only mutation routes
router.post(
  '/',
  rbacMiddleware(['ADMIN']),
  validateBody(createProductSchema),
  ProductController.createProduct
);

router.patch(
  '/:sku',
  rbacMiddleware(['ADMIN']),
  validateBody(updateProductSchema),
  ProductController.updateProduct
);

export default router;
