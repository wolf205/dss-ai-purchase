import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { createUserSchema, updateUserSchema } from '../validations/authValidations';

const router = Router();

// All user management routes require ADMIN role
router.use(authMiddleware, rbacMiddleware(['ADMIN']));

router.get('/', UserController.listUsers);
router.post('/', validateBody(createUserSchema), UserController.createUser);
router.get('/:id', UserController.getUserById);
router.patch('/:id', validateBody(updateUserSchema), UserController.updateUser);
router.patch('/:id/toggle-active', UserController.toggleActive);

export default router;
