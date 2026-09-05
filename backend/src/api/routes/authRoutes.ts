import { Router } from 'express';
import { authController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import { loginSchema, refreshTokenSchema } from '../validations/authValidations';

const router = Router();

router.post('/login', validateBody(loginSchema), catchAsync(authController.login));
router.post('/refresh', validateBody(refreshTokenSchema), catchAsync(authController.refreshToken));
router.get('/profile', authMiddleware, catchAsync(authController.getProfile));
router.post('/logout', authMiddleware, catchAsync(authController.logout));

export default router;
