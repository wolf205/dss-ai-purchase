import { Router } from 'express';
import { inventoryController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { catchAsync } from '../middlewares/catchAsync';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', catchAsync(inventoryController.getDashboard));
router.get('/items', catchAsync(inventoryController.getItems));
router.get('/abc-xyz', catchAsync(inventoryController.getAbcXyzMatrix));

export default router;
