import { Router } from 'express';
import { purchaseOrderController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  createPurchaseOrderSchema,
  getPurchaseOrdersSchema,
  poIdParamSchema,
  cancelPurchaseOrderBodySchema,
  receiveGoodsBodySchema
} from '../validations/purchaseOrderValidations';

const router = Router();

router.use(authMiddleware);

// GET /purchase-orders
router.get(
  '/',
  validateQuery(getPurchaseOrdersSchema),
  catchAsync(purchaseOrderController.listPurchaseOrders)
);

// GET /purchase-orders/:id
router.get(
  '/:id',
  validateParams(poIdParamSchema),
  catchAsync(purchaseOrderController.getPurchaseOrderById)
);

// POST /purchase-orders (Tạo đơn mua hàng - UC-012)
router.post(
  '/',
  rbacMiddleware(['ADMIN', 'STAFF']),
  validateBody(createPurchaseOrderSchema),
  catchAsync(purchaseOrderController.createPurchaseOrder)
);

// PUT /purchase-orders/:id/confirm (Xác nhận đơn - UC-012)
router.put(
  '/:id/confirm',
  rbacMiddleware(['ADMIN', 'STAFF']),
  validateParams(poIdParamSchema),
  catchAsync(purchaseOrderController.confirmPurchaseOrder)
);

// PUT /purchase-orders/:id/cancel (Hủy đơn - UC-013)
router.put(
  '/:id/cancel',
  rbacMiddleware(['ADMIN', 'STAFF']),
  validateParams(poIdParamSchema),
  validateBody(cancelPurchaseOrderBodySchema),
  catchAsync(purchaseOrderController.cancelPurchaseOrder)
);

// POST /purchase-orders/:id/receive (Nhận hàng - UC-014)
router.post(
  '/:id/receive',
  rbacMiddleware(['ADMIN', 'STAFF']),
  validateParams(poIdParamSchema),
  validateBody(receiveGoodsBodySchema),
  catchAsync(purchaseOrderController.receiveGoods)
);

export default router;
