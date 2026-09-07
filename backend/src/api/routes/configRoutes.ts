import { Router } from 'express';
import { supplierController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import { updateSupplierWeightsSchema } from '../validations/supplierValidations';

const router = Router();

router.use(authMiddleware);

// GET & PUT /config/supplier-weights (Docs 3.4, UC-017, FR-034, BR-013)
router.get('/supplier-weights', catchAsync(supplierController.getEvaluationWeights));
router.put(
  '/supplier-weights',
  rbacMiddleware(['ADMIN']),
  validateBody(updateSupplierWeightsSchema),
  catchAsync(supplierController.updateEvaluationWeights)
);

export default router;
