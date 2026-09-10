import { Router } from 'express';
import { supplierController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  supplierIdParamSchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierFilterSchema,
  productSupplierTermsSchema,
  updateSupplierWeightsSchema,
  supplierDeliveriesQuerySchema,
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

// Supplier product terms routes (UC-002, Docs 3.2)
router.get('/product/:sku', catchAsync(supplierController.getSuppliersByProductSku));
router.post(
  '/:id/products',
  rbacMiddleware(['ADMIN']),
  validateParams(supplierIdParamSchema),
  validateBody(productSupplierTermsSchema),
  catchAsync(supplierController.setProductSupplierTerms)
);
router.post(
  '/terms',
  rbacMiddleware(['ADMIN']),
  validateBody(productSupplierTermsSchema),
  catchAsync(supplierController.setProductSupplierTerms)
);

// Supplier evaluations & ranking routes (UC-009)
router.get('/evaluations', catchAsync(supplierController.getEvaluations));

// Supplier delivery history route (UC-009, FR-020, Docs 3.4)
router.get(
  '/:id/deliveries',
  validateParams(supplierIdParamSchema),
  validateQuery(supplierDeliveriesQuerySchema),
  catchAsync(supplierController.getSupplierDeliveries)
);

// General supplier CRUD routes (UC-002)
router.get('/', validateQuery(supplierFilterSchema), catchAsync(supplierController.listSuppliers));
router.get(
  '/:id',
  validateParams(supplierIdParamSchema),
  catchAsync(supplierController.getSupplierById)
);

router.post(
  '/',
  rbacMiddleware(['ADMIN']),
  validateBody(createSupplierSchema),
  catchAsync(supplierController.createSupplier)
);

router.put(
  '/:id',
  rbacMiddleware(['ADMIN']),
  validateParams(supplierIdParamSchema),
  validateBody(updateSupplierSchema),
  catchAsync(supplierController.updateSupplier)
);

router.patch(
  '/:id',
  rbacMiddleware(['ADMIN']),
  validateParams(supplierIdParamSchema),
  validateBody(updateSupplierSchema),
  catchAsync(supplierController.updateSupplier)
);

export default router;
