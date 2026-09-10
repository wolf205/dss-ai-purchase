import { Router } from 'express';
import { userController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { resetPasswordRateLimiter } from '../middlewares/rateLimitMiddleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  resetPasswordSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from '../validations/authValidations';

const router = Router();

// All user management routes require ADMIN role
router.use(authMiddleware, rbacMiddleware(['ADMIN']));

router.get('/', validateQuery(listUsersQuerySchema), catchAsync(userController.listUsers));
router.post('/', validateBody(createUserSchema), catchAsync(userController.createUser));
router.get('/:id', validateParams(userIdParamSchema), catchAsync(userController.getUserById));
router.put('/:id', validateParams(userIdParamSchema), validateBody(updateUserSchema), catchAsync(userController.updateUser));
router.patch('/:id', validateParams(userIdParamSchema), validateBody(updateUserSchema), catchAsync(userController.updateUser));
router.patch('/:id/status', validateParams(userIdParamSchema), validateBody(updateUserStatusSchema), catchAsync(userController.updateStatus));
router.post('/:id/reset-password', resetPasswordRateLimiter, validateParams(userIdParamSchema), validateBody(resetPasswordSchema), catchAsync(userController.resetPassword));

export default router;

