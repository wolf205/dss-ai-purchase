// Repositories
import { PrismaProductRepository } from '../repositories/PrismaProductRepository';
import { PrismaInventoryRepository } from '../repositories/PrismaInventoryRepository';
import { PrismaSalesHistoryRepository } from '../repositories/PrismaSalesHistoryRepository';
import { PrismaSupplierRepository } from '../repositories/PrismaSupplierRepository';
import { PrismaSupplierWeightConfigRepository } from '../repositories/PrismaSupplierWeightConfigRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaDataImportLogRepository } from '../repositories/PrismaDataImportLogRepository';
import { PrismaDeliveryHistoryRepository } from '../repositories/PrismaDeliveryHistoryRepository';
import { PrismaPurchaseOrderRepository } from '../repositories/PrismaPurchaseOrderRepository';
import { PrismaDemandForecastRepository } from '../repositories/PrismaDemandForecastRepository';
import { PrismaAbcXyzAnalysisRepository } from '../repositories/PrismaAbcXyzAnalysisRepository';
import { PrismaPurchaseRecommendationRepository } from '../repositories/PrismaPurchaseRecommendationRepository';
import { PrismaColdStartRepository } from '../repositories/PrismaColdStartRepository';
import { PrismaUnitOfWork } from '../database/PrismaUnitOfWork';

// Services, Utils, Security & External Clients
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher';
import { JwtTokenService } from '../security/JwtTokenService';
import { ExcelFileParser } from '../file-parsers/ExcelFileParser';
import { AxiosAIForecastClient } from '../external-services/AxiosAIForecastClient';

// Use Cases - Product
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';
import { GetProduct360UseCase } from '../../application/use-cases/product/GetProduct360UseCase';

// Use Cases - Auth & User
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/auth/ChangePasswordUseCase';
import { GetProfileUseCase } from '../../application/use-cases/auth/GetProfileUseCase';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';

// Use Cases - Supplier
import { ManageSupplierUseCase } from '../../application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../application/use-cases/supplier/GetSupplierWeightsUseCase';
import { GetSupplierEvaluationsUseCase } from '../../application/use-cases/supplier/GetSupplierEvaluationsUseCase';

// Use Cases - Data Ingestion
import { ImportSalesInventoryUseCase } from '../../application/use-cases/ingestion/ImportSalesInventoryUseCase';
import { GetDataImportLogsUseCase } from '../../application/use-cases/ingestion/GetDataImportLogsUseCase';

// Use Cases - Inventory & Analytics (Phase 3)
import { GetInventoryDashboardUseCase } from '../../application/use-cases/inventory/GetInventoryDashboardUseCase';
import { GetInventoryItemsUseCase } from '../../application/use-cases/inventory/GetInventoryItemsUseCase';
import { GetAbcXyzMatrixUseCase } from '../../application/use-cases/inventory/GetAbcXyzMatrixUseCase';

// Use Cases - Demand Forecasting (Phase 3)
import { GetForecastsUseCase } from '../../application/use-cases/forecast/GetForecastsUseCase';
import { GetSkuForecastUseCase } from '../../application/use-cases/forecast/GetSkuForecastUseCase';
import { SaveColdStartUseCase } from '../../application/use-cases/forecast/SaveColdStartUseCase';

// Use Cases - Recommendations & DSS Engine (Phase 3)
import { GetPurchaseRecommendationsUseCase } from '../../application/use-cases/recommendations/GetPurchaseRecommendationsUseCase';
import { RunDssAnalysisUseCase } from '../../application/use-cases/recommendations/RunDssAnalysisUseCase';

// Use Cases - Purchase Orders (Phase 4)
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/CreatePurchaseOrderUseCase';
import { GetPurchaseOrdersUseCase } from '../../application/use-cases/purchase-orders/GetPurchaseOrdersUseCase';
import { GetPurchaseOrderByIdUseCase } from '../../application/use-cases/purchase-orders/GetPurchaseOrderByIdUseCase';
import { ConfirmPurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/ConfirmPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/CancelPurchaseOrderUseCase';
import { ReceiveGoodsUseCase } from '../../application/use-cases/purchase-orders/ReceiveGoodsUseCase';

// Controllers
import { ProductController } from '../../api/controllers/ProductController';
import { AuthController } from '../../api/controllers/AuthController';
import { SupplierController } from '../../api/controllers/SupplierController';
import { UserController } from '../../api/controllers/UserController';
import { DataImportController } from '../../api/controllers/DataImportController';
import { InventoryController } from '../../api/controllers/InventoryController';
import { ForecastController } from '../../api/controllers/ForecastController';
import { RecommendationController } from '../../api/controllers/RecommendationController';
import { PurchaseOrderController } from '../../api/controllers/PurchaseOrderController';

// ==========================================
// 1. INITIALIZE INFRASTRUCTURE & REPOSITORIES
// ==========================================
const productRepository = new PrismaProductRepository();
const inventoryRepository = new PrismaInventoryRepository();
const salesHistoryRepository = new PrismaSalesHistoryRepository();
const supplierRepository = new PrismaSupplierRepository();
const supplierWeightConfigRepository = new PrismaSupplierWeightConfigRepository();
const deliveryHistoryRepository = new PrismaDeliveryHistoryRepository();
const userRepository = new PrismaUserRepository();
const dataImportLogRepository = new PrismaDataImportLogRepository();
const purchaseOrderRepository = new PrismaPurchaseOrderRepository();
const demandForecastRepository = new PrismaDemandForecastRepository();
const abcXyzAnalysisRepository = new PrismaAbcXyzAnalysisRepository();
const recommendationRepository = new PrismaPurchaseRecommendationRepository();
const coldStartRepository = new PrismaColdStartRepository();

const unitOfWork = new PrismaUnitOfWork();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const excelFileParser = new ExcelFileParser();
const aiForecastClient = new AxiosAIForecastClient(process.env.AI_SERVICE_URL || 'http://localhost:8000');

// ==========================================
// 2. INITIALIZE USE CASES
// ==========================================
// Product
const createProductUseCase = new CreateProductUseCase(productRepository, inventoryRepository, unitOfWork);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);
const getProduct360UseCase = new GetProduct360UseCase(
  productRepository,
  inventoryRepository,
  supplierRepository,
  abcXyzAnalysisRepository,
  demandForecastRepository,
  salesHistoryRepository
);

// Auth & User
const loginUseCase = new LoginUseCase(userRepository, passwordHasher, tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenService);
const getProfileUseCase = new GetProfileUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordHasher);
const manageUserUseCase = new ManageUserUseCase(userRepository, passwordHasher);

// Supplier
const manageSupplierUseCase = new ManageSupplierUseCase(supplierRepository);
const updateSupplierWeightsUseCase = new UpdateSupplierWeightsUseCase(supplierWeightConfigRepository);
const getSupplierWeightsUseCase = new GetSupplierWeightsUseCase(supplierWeightConfigRepository);
const getSupplierEvaluationsUseCase = new GetSupplierEvaluationsUseCase(
  supplierRepository,
  deliveryHistoryRepository,
  supplierWeightConfigRepository
);

// Data Ingestion
const importSalesInventoryUseCase = new ImportSalesInventoryUseCase(
  excelFileParser,
  productRepository,
  salesHistoryRepository,
  inventoryRepository,
  dataImportLogRepository,
  unitOfWork
);
const getDataImportLogsUseCase = new GetDataImportLogsUseCase(dataImportLogRepository);

// Inventory & Analytics (Phase 3)
const getInventoryDashboardUseCase = new GetInventoryDashboardUseCase(inventoryRepository);
const getInventoryItemsUseCase = new GetInventoryItemsUseCase(inventoryRepository);
const getAbcXyzMatrixUseCase = new GetAbcXyzMatrixUseCase(abcXyzAnalysisRepository);

// Demand Forecasting (Phase 3)
const getForecastsUseCase = new GetForecastsUseCase(demandForecastRepository, productRepository);
const getSkuForecastUseCase = new GetSkuForecastUseCase(demandForecastRepository, productRepository);
const saveColdStartUseCase = new SaveColdStartUseCase(coldStartRepository, productRepository, inventoryRepository);

// Recommendations & DSS Pipeline (Phase 3)
const getPurchaseRecommendationsUseCase = new GetPurchaseRecommendationsUseCase(recommendationRepository);
const runDssAnalysisUseCase = new RunDssAnalysisUseCase(
  productRepository,
  inventoryRepository,
  salesHistoryRepository,
  supplierRepository,
  deliveryHistoryRepository,
  supplierWeightConfigRepository,
  aiForecastClient,
  demandForecastRepository,
  abcXyzAnalysisRepository,
  recommendationRepository,
  coldStartRepository
);

// Purchase Orders (Phase 4)
const createPurchaseOrderUseCase = new CreatePurchaseOrderUseCase(
  purchaseOrderRepository,
  supplierRepository,
  productRepository,
  unitOfWork
);
const getPurchaseOrdersUseCase = new GetPurchaseOrdersUseCase(purchaseOrderRepository);
const getPurchaseOrderByIdUseCase = new GetPurchaseOrderByIdUseCase(purchaseOrderRepository);
const confirmPurchaseOrderUseCase = new ConfirmPurchaseOrderUseCase(
  purchaseOrderRepository,
  inventoryRepository,
  unitOfWork
);
const cancelPurchaseOrderUseCase = new CancelPurchaseOrderUseCase(
  purchaseOrderRepository,
  inventoryRepository,
  unitOfWork
);
const receiveGoodsUseCase = new ReceiveGoodsUseCase(
  purchaseOrderRepository,
  inventoryRepository,
  deliveryHistoryRepository,
  unitOfWork
);

// ==========================================
// 3. INITIALIZE CONTROLLERS
// ==========================================
export const productController = new ProductController(
  createProductUseCase,
  updateProductUseCase,
  getProductsUseCase,
  getProductDetailUseCase,
  getProduct360UseCase
);

export const authController = new AuthController(
  loginUseCase,
  refreshTokenUseCase,
  getProfileUseCase,
  changePasswordUseCase
);

export const supplierController = new SupplierController(
  manageSupplierUseCase,
  updateSupplierWeightsUseCase,
  getSupplierWeightsUseCase,
  getSupplierEvaluationsUseCase
);

export const userController = new UserController(manageUserUseCase);

export const dataImportController = new DataImportController(
  importSalesInventoryUseCase,
  getDataImportLogsUseCase
);

export const inventoryController = new InventoryController(
  getInventoryDashboardUseCase,
  getInventoryItemsUseCase,
  getAbcXyzMatrixUseCase
);

export const forecastController = new ForecastController(
  getForecastsUseCase,
  getSkuForecastUseCase,
  saveColdStartUseCase
);

export const recommendationController = new RecommendationController(
  getPurchaseRecommendationsUseCase,
  runDssAnalysisUseCase
);

export const purchaseOrderController = new PurchaseOrderController(
  createPurchaseOrderUseCase,
  getPurchaseOrdersUseCase,
  getPurchaseOrderByIdUseCase,
  confirmPurchaseOrderUseCase,
  cancelPurchaseOrderUseCase,
  receiveGoodsUseCase
);
