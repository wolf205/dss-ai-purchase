import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { loginSchema, refreshTokenSchema } from '../validations/authValidations';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refreshToken);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
