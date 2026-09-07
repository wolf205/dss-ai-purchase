import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import supplierRoutes from './supplierRoutes';
import importRoutes from './importRoutes';
import purchaseOrderRoutes from './purchaseOrderRoutes';
import configRoutes from './configRoutes';
import inventoryRoutes from './inventoryRoutes';
import forecastRoutes from './forecastRoutes';
import recommendationRoutes from './recommendationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/imports', importRoutes);
router.use('/data-import', importRoutes); // Docs 2.4 specification alias
router.use('/config', configRoutes); // Docs 3.4 specification
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/recommendations', recommendationRoutes);

export default router;
