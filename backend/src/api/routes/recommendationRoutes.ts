import { Router } from 'express';
import { recommendationController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { catchAsync } from '../middlewares/catchAsync';

const router = Router();

router.use(authMiddleware);

router.get('/', catchAsync(recommendationController.getRecommendations));
router.post('/run-analysis', catchAsync(recommendationController.runAnalysis));

export default router;
