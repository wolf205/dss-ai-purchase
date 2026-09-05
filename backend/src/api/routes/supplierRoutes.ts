import { Router } from 'express';
import { supplierController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierFilterSchema,
  productSupplierTermsSchema,
  updateSupplierWeightsSchema,
} from '../validations/supplierValidations';

const router = Router();

router.use(authMiddleware);

// Evaluation weights routes (UC-017)
router.get('/weights', catchAsync(supplierController.getEvaluationWeights));
router.put(
  '/weights',
  rbacMiddleware(['ADMIN']),
  validateBody(updateSupplierWeightsSchema),
  catchAsync(supplierController.updateEvaluationWeights)
);

// Supplier product terms routes (UC-002)
router.get('/product/:sku', catchAsync(supplierController.getSuppliersByProductSku));
router.post(
  '/terms',
  rbacMiddleware(['ADMIN']),
  validateBody(productSupplierTermsSchema),
  catchAsync(supplierController.setProductSupplierTerms)
);

// General supplier CRUD routes (UC-002)
router.get('/', validateQuery(supplierFilterSchema), catchAsync(supplierController.listSuppliers));
router.get('/:id', catchAsync(supplierController.getSupplierById));

router.post(
  '/',
  rbacMiddleware(['ADMIN']),
  validateBody(createSupplierSchema),
  catchAsync(supplierController.createSupplier)
);

router.patch(
  '/:id',
  rbacMiddleware(['ADMIN']),
  validateBody(updateSupplierSchema),
  catchAsync(supplierController.updateSupplier)
);

export default router;
