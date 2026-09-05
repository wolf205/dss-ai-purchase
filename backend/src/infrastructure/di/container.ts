// Repositories
import { PrismaProductRepository } from '../repositories/PrismaProductRepository';
import { PrismaInventoryRepository } from '../repositories/PrismaInventoryRepository';
import { PrismaSalesHistoryRepository } from '../repositories/PrismaSalesHistoryRepository';
import { PrismaSupplierRepository } from '../repositories/PrismaSupplierRepository';
import { PrismaSupplierWeightConfigRepository } from '../repositories/PrismaSupplierWeightConfigRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaDataImportLogRepository } from '../repositories/PrismaDataImportLogRepository';
import { PrismaUnitOfWork } from '../database/PrismaUnitOfWork';

// Services, Utils, Security
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher';
import { JwtTokenService } from '../security/JwtTokenService';
import { ExcelFileParser } from '../file-parsers/ExcelFileParser';

// Use Cases - Product
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { GetProductsUseCase } from '../../application/use-cases/product/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';

// Use Cases - Auth & User
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { ManageUserUseCase } from '../../application/use-cases/user/ManageUserUseCase';

// Use Cases - Supplier
import { ManageSupplierUseCase } from '../../application/use-cases/supplier/ManageSupplierUseCase';
import { UpdateSupplierWeightsUseCase } from '../../application/use-cases/supplier/UpdateSupplierWeightsUseCase';
import { GetSupplierWeightsUseCase } from '../../application/use-cases/supplier/GetSupplierWeightsUseCase';

// Use Cases - Data Ingestion
import { ImportSalesInventoryUseCase } from '../../application/use-cases/ingestion/ImportSalesInventoryUseCase';

// Controllers
import { ProductController } from '../../api/controllers/ProductController';
import { AuthController } from '../../api/controllers/AuthController';
import { SupplierController } from '../../api/controllers/SupplierController';
import { UserController } from '../../api/controllers/UserController';
import { DataImportController } from '../../api/controllers/DataImportController';

// ==========================================
// 1. INITIALIZE INFRASTRUCTURE & REPOSITORIES
// ==========================================
const productRepository = new PrismaProductRepository();
const inventoryRepository = new PrismaInventoryRepository();
const salesHistoryRepository = new PrismaSalesHistoryRepository();
const supplierRepository = new PrismaSupplierRepository();
const supplierWeightConfigRepository = new PrismaSupplierWeightConfigRepository();
const userRepository = new PrismaUserRepository();
const dataImportLogRepository = new PrismaDataImportLogRepository();

const unitOfWork = new PrismaUnitOfWork();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const excelFileParser = new ExcelFileParser();

// ==========================================
// 2. INITIALIZE USE CASES
// ==========================================
// Product
const createProductUseCase = new CreateProductUseCase(productRepository, inventoryRepository, unitOfWork);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);

// Auth & User
const loginUseCase = new LoginUseCase(userRepository, passwordHasher, tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenService);
const manageUserUseCase = new ManageUserUseCase(userRepository, passwordHasher);

// Supplier
const manageSupplierUseCase = new ManageSupplierUseCase(supplierRepository);
const updateSupplierWeightsUseCase = new UpdateSupplierWeightsUseCase(supplierWeightConfigRepository);
const getSupplierWeightsUseCase = new GetSupplierWeightsUseCase(supplierWeightConfigRepository);

// Data Ingestion
const importSalesInventoryUseCase = new ImportSalesInventoryUseCase(
  excelFileParser,
  productRepository,
  salesHistoryRepository,
  inventoryRepository,
  dataImportLogRepository,
  unitOfWork
);

// ==========================================
// 3. INITIALIZE CONTROLLERS
// ==========================================
export const productController = new ProductController(
  createProductUseCase,
  updateProductUseCase,
  getProductsUseCase,
  getProductDetailUseCase
);

export const authController = new AuthController(
  loginUseCase,
  refreshTokenUseCase,
  userRepository
);

export const supplierController = new SupplierController(
  manageSupplierUseCase,
  updateSupplierWeightsUseCase,
  getSupplierWeightsUseCase
);

export const userController = new UserController(manageUserUseCase);

export const dataImportController = new DataImportController(
  importSalesInventoryUseCase,
  dataImportLogRepository
);
