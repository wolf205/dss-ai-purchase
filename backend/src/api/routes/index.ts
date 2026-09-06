import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import supplierRoutes from './supplierRoutes';
import importRoutes from './importRoutes';
import purchaseOrderRoutes from './purchaseOrderRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/imports', importRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);

export default router;
