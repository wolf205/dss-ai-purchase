import { Router } from 'express';
import { userController } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { catchAsync } from '../middlewares/catchAsync';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '../validations/authValidations';

const router = Router();

// All user management routes require ADMIN role
router.use(authMiddleware, rbacMiddleware(['ADMIN']));

router.get('/', catchAsync(userController.listUsers));
router.post('/', validateBody(createUserSchema), catchAsync(userController.createUser));
router.get('/:id', catchAsync(userController.getUserById));
router.patch('/:id', validateBody(updateUserSchema), catchAsync(userController.updateUser));

// PATCH /:id/status (Docs 1.6, Frontend UserManagementPage)
router.patch('/:id/status', validateBody(updateUserStatusSchema), catchAsync(userController.updateStatus));

// Legacy toggle endpoint (kept for backwards compatibility)
router.patch('/:id/toggle-active', catchAsync(userController.toggleActive));

export default router;
