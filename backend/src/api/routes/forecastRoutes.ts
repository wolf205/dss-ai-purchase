import { Router } from 'express';
import { forecastController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { catchAsync } from '../middlewares/catchAsync';

const router = Router();

router.use(authMiddleware);

router.get('/', catchAsync(forecastController.getForecasts));
router.post('/generate', catchAsync(forecastController.generateForecasts));
router.post('/cold-start', catchAsync(forecastController.saveColdStart));
router.get('/:sku', catchAsync(forecastController.getSkuForecast));

export default router;
