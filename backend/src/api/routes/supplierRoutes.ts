import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
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
router.get('/weights', SupplierController.getEvaluationWeights);
router.put(
  '/weights',
  rbacMiddleware(['ADMIN']),
  validateBody(updateSupplierWeightsSchema),
  SupplierController.updateEvaluationWeights
);

// Supplier product terms routes (UC-002)
router.get('/product/:sku', SupplierController.getSuppliersByProductSku);
router.post(
  '/terms',
  rbacMiddleware(['ADMIN']),
  validateBody(productSupplierTermsSchema),
  SupplierController.setProductSupplierTerms
);

// General supplier CRUD routes (UC-002)
router.get('/', validateQuery(supplierFilterSchema), SupplierController.listSuppliers);
router.get('/:id', SupplierController.getSupplierById);

router.post(
  '/',
  rbacMiddleware(['ADMIN']),
  validateBody(createSupplierSchema),
  SupplierController.createSupplier
);

router.patch(
  '/:id',
  rbacMiddleware(['ADMIN']),
  validateBody(updateSupplierSchema),
  SupplierController.updateSupplier
);

export default router;
