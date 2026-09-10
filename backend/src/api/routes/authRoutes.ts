import { Router } from 'express';
import { authController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '../validations/authValidations';
import { loginRateLimiter, changePasswordRateLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

router.post('/login', loginRateLimiter, validateBody(loginSchema), catchAsync(authController.login));
router.post('/refresh', validateBody(refreshTokenSchema), catchAsync(authController.refreshToken));


// GET /me (Docs 1.2, Frontend authApi.getMe) & alias /profile
router.get('/me', authMiddleware, catchAsync(authController.getProfile));

// POST /change-password (Docs 1.3, Frontend authApi.changePassword)
router.post(
  '/change-password',
  authMiddleware,
  changePasswordRateLimiter,
  validateBody(changePasswordSchema),
  catchAsync(authController.changePassword)
);

router.post('/logout', authMiddleware, catchAsync(authController.logout));

export default router;
