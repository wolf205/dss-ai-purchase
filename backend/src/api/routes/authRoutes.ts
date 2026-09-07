import { Router } from 'express';
import { authController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../validations/authValidations';

const router = Router();

router.post('/login', validateBody(loginSchema), catchAsync(authController.login));
router.post('/refresh', validateBody(refreshTokenSchema), catchAsync(authController.refreshToken));

// GET /me (Docs 1.2, Frontend authApi.getMe) & alias /profile
router.get('/me', authMiddleware, catchAsync(authController.getProfile));
router.get('/profile', authMiddleware, catchAsync(authController.getProfile));

// POST /change-password (Docs 1.3, Frontend authApi.changePassword)
router.post(
  '/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  catchAsync(authController.changePassword)
);

router.post('/logout', authMiddleware, catchAsync(authController.logout));

export default router;
