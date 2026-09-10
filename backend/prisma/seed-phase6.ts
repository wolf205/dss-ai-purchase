import { PrismaClient, UserRole, RiskLevel, POStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { runDssAnalysisUseCase, generateForecastsUseCase } from '../src/infrastructure/di/container';

const prisma = new PrismaClient();

enum MaturityTier {
  COLD_START = 'COLD_START',
  BASIC_FORECAST = 'BASIC_FORECAST',
  AI_READY = 'AI_READY',
}

interface ProductSeedDef {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  defaultLeadTime: number;
  minSafetyStock: number;
  supplierCode: string;
  moq: number;
  packSize: number;
  tier: MaturityTier;
  targetRisk: RiskLevel;
  abcTarget: 'A' | 'B' | 'C';
  xyzTarget: 'X' | 'Y' | 'Z';
  baseDailySales: number;
}

async function main() {
  console.log('🚀 [PHASE 6] Khởi tạo bộ dữ liệu thực tế 120 SKU Bán lẻ FMCG & 90 ngày lịch sử bán hàng...');

  // ===========================================================================
  // 1. DỌN DẸP DỮ LIỆU CŨ AN TOÀN ĐỂ SEED IDEMPOTENT
  // ===========================================================================
  console.log('🧹 Đang dọn dẹp dữ liệu giao dịch cũ...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE audit_logs, delivery_history, purchase_order_items, purchase_orders, 
                   purchase_recommendations, supplier_evaluations, demand_forecasts, 
                   cold_start_inputs, sales_history, data_import_logs, inventory_snapshots, 
                   inventory, product_suppliers, products, suppliers 
    RESTART IDENTITY CASCADE;
  `);

  // ===========================================================================
  // 2. KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN & NHÂN VIÊN
  // ===========================================================================
  console.log('👤 Khởi tạo tài khoản người dùng...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123', salt);
  const staffPasswordHash = await bcrypt.hash('Staff@123', salt);

  const adminId = 'a0000000-0000-0000-0000-000000000001';
  const staffId = 'a0000000-0000-0000-0000-000000000002';

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: adminId,
      username: 'admin',
      passwordHash,
      fullName: 'Nguyễn Văn Quản Trị (Admin)',
      email: 'admin@dss-purchase.vn',
      role: UserRole.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      id: staffId,
      username: 'staff',
      passwordHash: staffPasswordHash,
      fullName: 'Trần Thị Thu Mua (Purchaser)',
      email: 'staff@dss-purchase.vn',
      role: UserRole.STAFF,
      isActive: true,
      mustChangePassword: false,
    },
  });

  // ===========================================================================
  // 3. KHỞI TẠO CẤU HÌNH TRỌNG SỐ ĐÁNH GIÁ NHÀ CUNG CẤP (BR-013)
  // ===========================================================================
  console.log('⚖️ Cấu hình trọng số đánh giá NCC (OTIF: 35%, Quality: 30%, Price: 20%, LeadTime: 15%)...');
  await prisma.supplierEvaluationWeight.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      weightOtif: 35.0,
      weightQuality: 30.0,
      weightPrice: 20.0,
      weightLeadtime: 15.0,
      updatedBy: admin.id,
    },
  });

  // ===========================================================================
  // 4. KHỞI TẠO 6 NHÀ CUNG CẤP FMCG HÀNG ĐẦU VIỆT NAM
  // ===========================================================================
  console.log('🏢 Khởi tạo 6 Nhà cung cấp chiến lược...');
  const suppliersData = [
    {
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      phone: '02854155555',
      email: 'sales@vinamilk.com.vn',
      address: 'Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM',
    },
    {
      code: 'SUP-HEINEKEN',
      name: 'Công ty TNHH Nhà Máy Bia HEINEKEN Việt Nam',
      phone: '02838222755',
      email: 'order@heineken.vn',
      address: 'Tầng 18-19, Vietcombank Tower, Bến Nghé, Quận 1, TP.HCM',
    },
    {
      code: 'SUP-MASAN',
      name: 'Công ty Cổ phần Hàng tiêu dùng Masan (Masan Consumer)',
      phone: '02862555660',
      email: 'consumer@masangroup.com',
      address: 'Tầng 12, MPlaza Saigon, 39 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM',
    },
    {
      code: 'SUP-UNILEVER',
      name: 'Công ty TNHH Quốc Tế Unilever Việt Nam',
      phone: '02854135686',
      email: 'support.vn@unilever.com',
      address: 'Khu công nghiệp Tây Bắc Củ Chi, TP.HCM',
    },
    {
      code: 'SUP-ACECOOK',
      name: 'Công ty Cổ phần Acecook Việt Nam',
      phone: '02838154064',
      email: 'contact@acecookvietnam.com',
      address: 'Lô II-3, Đường số 11, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM',
    },
    {
      code: 'SUP-KINHDO',
      name: 'Công ty Cổ phần Mondelez Kinh Đô Việt Nam',
      phone: '02838270838',
      email: 'customercare@mdlz.com',
      address: '138-142 Hai Bà Trưng, Đa Kao, Quận 1, TP.HCM',
    },
  ];

  const supplierMap = new Map<string, bigint>();
  for (const s of suppliersData) {
    const created = await prisma.supplier.create({
      data: {
        code: s.code,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        isActive: true,
      },
    });
    supplierMap.set(s.code, created.id);
  }

  // ===========================================================================
  // 5. DANH SÁCH 120 SẢN PHẨM PHÂN BỔ 6 NGÀNH HÀNG & 9 PHÂN KHÚC ABC-XYZ
  // ===========================================================================
  console.log('📦 Chuẩn bị danh mục 120 SKU thực tế...');
  const productDefs: ProductSeedDef[] = [
    // -------------------------------------------------------------------------
    // NHÓM 1: SỮA & BƠ SỮA (20 SKU - SUP-VINAMILK)
    // -------------------------------------------------------------------------
    { sku: 'MILK-VNM-180', name: 'Sữa tươi tiệt trùng Vinamilk có đường 180ml', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 6200, sellingPrice: 8500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-VINAMILK', moq: 48, packSize: 48, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 65 },
    { sku: 'MILK-VNM-110', name: 'Sữa tươi tiệt trùng Vinamilk có đường 110ml', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 4200, sellingPrice: 5800, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-VINAMILK', moq: 48, packSize: 48, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 50 },
    { sku: 'MILK-VNM-1L', name: 'Sữa tươi tiệt trùng Vinamilk không đường 1L', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 27000, sellingPrice: 34000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 22 },
    { sku: 'MILK-TH-180', name: 'Sữa tươi tiệt trùng nguyên chất TH True Milk 180ml', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 6500, sellingPrice: 9000, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-VINAMILK', moq: 48, packSize: 48, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'MILK-TH-1L', name: 'Sữa tươi tiệt trùng ít đường TH True Milk 1L', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 28500, sellingPrice: 36000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.CRITICAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 15 },
    { sku: 'YOGURT-VNM-100', name: 'Sữa chua ăn có đường Vinamilk 100g (Lốc 4 hộp)', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 20000, sellingPrice: 26000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-VINAMILK', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 35 },
    { sku: 'YOGURT-TH-100', name: 'Sữa chua ăn tự nhiên TH True Yogurt 100g', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 22000, sellingPrice: 28000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-VINAMILK', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 20 },
    { sku: 'YOGURT-DRINK-VNM', name: 'Sữa chua uống tiệt trùng SuSu hương cam 110ml', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 18000, sellingPrice: 23000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 28 },
    { sku: 'CONDENSED-MILK-ONGTHO', name: 'Sữa đặc có đường Ông Thọ chữ đỏ lon 380g', category: 'Sữa & Bơ sữa', unit: 'Lon', costPrice: 20500, sellingPrice: 25000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-VINAMILK', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'CONDENSED-MILK-NGSAO', name: 'Sữa đặc Ngôi Sao Phương Nam xanh dương 380g', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 16000, sellingPrice: 20000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-VINAMILK', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'CHEESE-CONBO-8P', name: 'Phô mai Con Bò Cười truyền thống hộp 8 miếng', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 31000, sellingPrice: 39000, defaultLeadTime: 4, minSafetyStock: 16, supplierCode: 'SUP-VINAMILK', moq: 16, packSize: 8, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OUT_OF_STOCK, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 12 },
    { sku: 'BUTTER-PRESIDENT-200', name: 'Bơ lạt tự nhiên President 200g', category: 'Sữa & Bơ sữa', unit: 'Gói', costPrice: 72000, sellingPrice: 89000, defaultLeadTime: 5, minSafetyStock: 8, supplierCode: 'SUP-VINAMILK', moq: 6, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OVERSTOCK, abcTarget: 'B', xyzTarget: 'Z', baseDailySales: 4 },
    { sku: 'SOY-MILK-FAMISUGAR', name: 'Sữa đậu nành Fami nguyên chất có đường 200ml', category: 'Sữa & Bơ sữa', unit: 'Bịch', costPrice: 3800, sellingPrice: 5000, defaultLeadTime: 2, minSafetyStock: 40, supplierCode: 'SUP-VINAMILK', moq: 40, packSize: 40, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 38 },
    { sku: 'SOY-MILK-FAMICANXI', name: 'Sữa đậu nành Fami Canxi lốc 6 hộp 200ml', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 24000, sellingPrice: 31000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-VINAMILK', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'MILK-NUTRIFOOD-180', name: 'Sữa dinh dưỡng NutiFood tiệt trùng 180ml', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 5200, sellingPrice: 7000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-VINAMILK', moq: 24, packSize: 24, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 14 },
    { sku: 'MILK-MILO-180', name: 'Sữa lúa mạch Nestlé Milo ít đường 180ml', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 25500, sellingPrice: 32000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 40 },
    { sku: 'MILK-MILO-115', name: 'Sữa lúa mạch Nestlé Milo nguyên bản 115ml', category: 'Sữa & Bơ sữa', unit: 'Lốc', costPrice: 17000, sellingPrice: 22000, defaultLeadTime: 2, minSafetyStock: 24, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 22 },
    { sku: 'ICE-CREAM-MERINO', name: 'Kem que Merino đậu đỏ sữa dừa 60g', category: 'Sữa & Bơ sữa', unit: 'Cây', costPrice: 8500, sellingPrice: 12000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-VINAMILK', moq: 20, packSize: 20, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.CRITICAL, abcTarget: 'C', xyzTarget: 'Z', baseDailySales: 10 },
    { sku: 'ICE-CREAM-CELANO', name: 'Kem ốc quế Celano socola vanilla 110ml', category: 'Sữa & Bơ sữa', unit: 'Cây', costPrice: 16500, sellingPrice: 22000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-VINAMILK', moq: 15, packSize: 15, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Z', baseDailySales: 8 },
    { sku: 'MILK-VNM-ORGANIC-1L', name: 'Sữa tươi hữu cơ cao cấp Vinamilk Organic 1L', category: 'Sữa & Bơ sữa', unit: 'Hộp', costPrice: 48000, sellingPrice: 62000, defaultLeadTime: 4, minSafetyStock: 12, supplierCode: 'SUP-VINAMILK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'A', xyzTarget: 'Z', baseDailySales: 9 },

    // -------------------------------------------------------------------------
    // NHÓM 2: ĐỒ UỐNG & GIẢI KHÁT (20 SKU - SUP-HEINEKEN)
    // -------------------------------------------------------------------------
    { sku: 'BEER-TIGER-330', name: 'Bia Tiger lon 330ml (Thùng 24 lon)', category: 'Đồ uống & Giải khát', unit: 'Thùng', costPrice: 345000, sellingPrice: 390000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-HEINEKEN', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'BEER-TIGER-CRYSTAL', name: 'Bia Tiger Crystal lon bạc 330ml (Thùng 24 lon)', category: 'Đồ uống & Giải khát', unit: 'Thùng', costPrice: 360000, sellingPrice: 410000, defaultLeadTime: 2, minSafetyStock: 12, supplierCode: 'SUP-HEINEKEN', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'BEER-HEINEKEN-330', name: 'Bia Heineken lon 330ml (Thùng 24 lon)', category: 'Đồ uống & Giải khát', unit: 'Thùng', costPrice: 410000, sellingPrice: 460000, defaultLeadTime: 2, minSafetyStock: 10, supplierCode: 'SUP-HEINEKEN', moq: 5, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 12 },
    { sku: 'BEER-SAIGON-SPEC', name: 'Bia Sài Gòn Special lon 330ml (Thùng 24 lon)', category: 'Đồ uống & Giải khát', unit: 'Thùng', costPrice: 315000, sellingPrice: 355000, defaultLeadTime: 3, minSafetyStock: 10, supplierCode: 'SUP-HEINEKEN', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 10 },
    { sku: 'BEER-333-330', name: 'Bia 333 lon 330ml (Thùng 24 lon)', category: 'Đồ uống & Giải khát', unit: 'Thùng', costPrice: 255000, sellingPrice: 290000, defaultLeadTime: 3, minSafetyStock: 10, supplierCode: 'SUP-HEINEKEN', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 8 },
    { sku: 'COCA-COLA-320', name: 'Nước ngọt Coca-Cola vị nguyên bản lon 320ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 7500, sellingPrice: 10500, defaultLeadTime: 2, minSafetyStock: 72, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 70 },
    { sku: 'PEPSI-CAN-320', name: 'Nước ngọt Pepsi lon 320ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 7400, sellingPrice: 10000, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 55 },
    { sku: 'SEVEN-UP-320', name: 'Nước ngọt 7Up vị chanh lon 320ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 7200, sellingPrice: 10000, defaultLeadTime: 2, minSafetyStock: 36, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'MIRINDA-ORANGE-320', name: 'Nước ngọt Mirinda hương cam lon 320ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 7200, sellingPrice: 10000, defaultLeadTime: 2, minSafetyStock: 36, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 28 },
    { sku: 'SPRITE-CAN-320', name: 'Nước ngọt Sprite hương chanh lon 320ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 7300, sellingPrice: 10000, defaultLeadTime: 2, minSafetyStock: 24, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 20 },
    { sku: 'ENERGY-RED-BULL', name: 'Nước tăng lực Red Bull nắp vàng lon 250ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 9800, sellingPrice: 13500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 50 },
    { sku: 'ENERGY-STING-RED', name: 'Nước tăng lực Sting hương dâu tây lon 330ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 8000, sellingPrice: 11000, defaultLeadTime: 2, minSafetyStock: 60, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 60 },
    { sku: 'ENERGY-WAKEUP-247', name: 'Nước tăng lực vị cà phê Wake-Up 247 330ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 7800, sellingPrice: 10500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 35 },
    { sku: 'TEA-C2-LEMON', name: 'Trà xanh C2 hương chanh chai 455ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 6500, sellingPrice: 9000, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 40 },
    { sku: 'TEA-KHONG-DO', name: 'Trà xanh Không Độ chai 455ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 7200, sellingPrice: 10000, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 35 },
    { sku: 'TEA-O-LONG-450', name: 'Trà Ô Long Tea+ Plus chai 450ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 7500, sellingPrice: 10500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'WATER-AQUAFINA-500', name: 'Nước tinh khiết Aquafina chai 500ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 4200, sellingPrice: 6000, defaultLeadTime: 2, minSafetyStock: 72, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 80 },
    { sku: 'WATER-LAVIE-500', name: 'Nước khoáng thiên nhiên La Vie chai 500ml', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 4400, sellingPrice: 6500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 50 },
    { sku: 'COFFEE-NESCAFE-CAN', name: 'Cà phê sữa đá đóng lon Nescafé 180ml', category: 'Đồ uống & Giải khát', unit: 'Lon', costPrice: 10500, sellingPrice: 14500, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 24, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.CRITICAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 16 },
    { sku: 'BEER-CORONA-355', name: 'Bia Corona Extra chai thủy tinh 355ml nhập khẩu', category: 'Đồ uống & Giải khát', unit: 'Chai', costPrice: 32000, sellingPrice: 42000, defaultLeadTime: 5, minSafetyStock: 24, supplierCode: 'SUP-HEINEKEN', moq: 24, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OVERSTOCK, abcTarget: 'A', xyzTarget: 'Z', baseDailySales: 6 },

    // -------------------------------------------------------------------------
    // NHÓM 3: THỰC PHẨM KHÔ & ĂN LIỀN (20 SKU - SUP-ACECOOK)
    // -------------------------------------------------------------------------
    { sku: 'NOODLE-HAOHAO-75', name: 'Mì ăn liền Hảo Hảo tôm chua cay 75g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 108000, sellingPrice: 125000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-ACECOOK', moq: 20, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'NOODLE-HAOHAO-SAUTE', name: 'Mì ăn liền Hảo Hảo sa tế hành 75g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 108000, sellingPrice: 125000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 15 },
    { sku: 'NOODLE-HAOHAO-DRY', name: 'Mì xào Hảo Hảo tôm xào chua ngọt 75g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 112000, sellingPrice: 130000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 14 },
    { sku: 'NOODLE-OMACHI-SUON', name: 'Mì khoai tây Omachi sườn hầm ngũ quả 80g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 205000, sellingPrice: 240000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 22 },
    { sku: 'NOODLE-OMACHI-BO', name: 'Mì khoai tây Omachi xốt bò hầm 80g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 205000, sellingPrice: 240000, defaultLeadTime: 2, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 18 },
    { sku: 'NOODLE-KOKOMI-90', name: 'Mì Kokomi đại 90g tôm chua cay (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 95000, sellingPrice: 112000, defaultLeadTime: 2, minSafetyStock: 25, supplierCode: 'SUP-ACECOOK', moq: 15, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 28 },
    { sku: 'NOODLE-DE-NHAT', name: 'Mì Đệ Nhất thịt bằm 82g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 150000, sellingPrice: 180000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 10 },
    { sku: 'NOODLE-MI-GA-DO', name: 'Mì Gấu Đỏ gà sợi phở 64g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 98000, sellingPrice: 115000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 16 },
    { sku: 'PHO-DE-NHAT-BO', name: 'Phở bò Đệ Nhất gói 65g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 210000, sellingPrice: 255000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 12 },
    { sku: 'PHO-VIFON-BO', name: 'Phở bò Vifon gói 65g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 195000, sellingPrice: 235000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.CRITICAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 11 },
    { sku: 'PHO-VIFON-GA', name: 'Phở gà Vifon gói 65g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 195000, sellingPrice: 235000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 8 },
    { sku: 'MIEN-PHU-HUONG-SUON', name: 'Miến Phú Hương sườn heo 55g (Thùng 24 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 216000, sellingPrice: 260000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-ACECOOK', moq: 8, packSize: 4, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 10 },
    { sku: 'MIEN-PHU-HUONG-THITBAM', name: 'Miến Phú Hương thịt bằm 55g (Thùng 24 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 216000, sellingPrice: 260000, defaultLeadTime: 3, minSafetyStock: 10, supplierCode: 'SUP-ACECOOK', moq: 8, packSize: 4, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 7 },
    { sku: 'PORRIDGE-GAU-DO-THIT', name: 'Cháo ăn liền Gấu Đỏ thịt bằm 50g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 135000, sellingPrice: 165000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 12 },
    { sku: 'PORRIDGE-VIFON-BO', name: 'Cháo ăn liền Vifon thịt bò 50g (Thùng 30 gói)', category: 'Thực phẩm khô', unit: 'Thùng', costPrice: 140000, sellingPrice: 170000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 5, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.OUT_OF_STOCK, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 6 },
    { sku: 'DRIED-VERMICELLI-BACO', name: 'Bún tươi sấy khô Ba Cô Gái 500g', category: 'Thực phẩm khô', unit: 'Gói', costPrice: 18500, sellingPrice: 24000, defaultLeadTime: 4, minSafetyStock: 24, supplierCode: 'SUP-ACECOOK', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 14 },
    { sku: 'RICE-PAPER-SAFOCO', name: 'Bánh tráng gỏi cuốn Safoco 300g', category: 'Thực phẩm khô', unit: 'Xấp', costPrice: 12000, sellingPrice: 16000, defaultLeadTime: 4, minSafetyStock: 20, supplierCode: 'SUP-ACECOOK', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 11 },
    { sku: 'CORN-FLAKES-NESTLE', name: 'Ngũ cốc ăn sáng Nestlé Koko Krunch 170g', category: 'Thực phẩm khô', unit: 'Hộp', costPrice: 36000, sellingPrice: 47000, defaultLeadTime: 4, minSafetyStock: 12, supplierCode: 'SUP-ACECOOK', moq: 12, packSize: 6, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Z', baseDailySales: 5 },
    { sku: 'DRIED-MUSHROOM-100', name: 'Nấm đông cô khô loại đặc biệt 100g', category: 'Thực phẩm khô', unit: 'Gói', costPrice: 45000, sellingPrice: 60000, defaultLeadTime: 5, minSafetyStock: 10, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OVERSTOCK, abcTarget: 'C', xyzTarget: 'Z', baseDailySales: 3 },
    { sku: 'DRIED-SEAWEED-MIWON', name: 'Rong biển nấu canh khô Miwon 50g', category: 'Thực phẩm khô', unit: 'Gói', costPrice: 22000, sellingPrice: 30000, defaultLeadTime: 4, minSafetyStock: 15, supplierCode: 'SUP-ACECOOK', moq: 10, packSize: 10, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.CRITICAL, abcTarget: 'C', xyzTarget: 'Z', baseDailySales: 4 },

    // -------------------------------------------------------------------------
    // NHÓM 4: GIA VỊ & ĐỒ NẤU (20 SKU - SUP-MASAN)
    // -------------------------------------------------------------------------
    { sku: 'COOKING-OIL-NEPTUNE', name: 'Dầu ăn thượng hạng Neptune Gold 1 Lít', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 49000, sellingPrice: 59000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'COOKING-OIL-SIMPLY', name: 'Dầu đậu nành nguyên chất Simply 1 Lít', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 52000, sellingPrice: 63000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 28 },
    { sku: 'COOKING-OIL-MEIZAN', name: 'Dầu thực vật Meizan Gold 1 Lít', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 42000, sellingPrice: 50000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 24 },
    { sku: 'COOKING-OIL-TUONGAN', name: 'Dầu ăn Tường An Cooking Oil 1 Lít', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 43000, sellingPrice: 52000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'FISH-SAUCE-CHINSU-500', name: 'Nước mắm Chinsu hương cá hồi 500ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 38000, sellingPrice: 47000, defaultLeadTime: 2, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 15, packSize: 15, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 32 },
    { sku: 'FISH-SAUCE-NAMNGU-900', name: 'Nước mắm Nam Ngư Đệ Nhị 900ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 22000, sellingPrice: 28000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-MASAN', moq: 15, packSize: 15, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'FISH-SAUCE-NAMNGU-GOLD', name: 'Nước mắm Nam Ngư Gold nhãn vàng 650ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 42000, sellingPrice: 52000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-MASAN', moq: 15, packSize: 15, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 16 },
    { sku: 'SOY-SAUCE-CHINSU-250', name: 'Nước tương Chinsu tỏi ớt 250ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 14500, sellingPrice: 19000, defaultLeadTime: 2, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 22 },
    { sku: 'SOY-SAUCE-MAGGI-300', name: 'Nước tương Maggi đậm đặc chai 300ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 18000, sellingPrice: 23500, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'SOY-SAUCE-TAMTHAI-500', name: 'Nước tương Tam Thái Tử Nhất Ca 500ml', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 11000, sellingPrice: 15000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'CHILI-SAUCE-CHINSU', name: 'Tương ớt Chinsu nắp đỏ chai 250g', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 11500, sellingPrice: 15500, defaultLeadTime: 2, minSafetyStock: 48, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 55 },
    { sku: 'CHILI-SAUCE-SUPER', name: 'Tương ớt Chinsu Vạn Triệu Cay 250g', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 14000, sellingPrice: 19000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 12 },
    { sku: 'TOMATO-SAUCE-CHINSU', name: 'Tương cà Chinsu chai 250g', category: 'Gia vị & Đồ nấu', unit: 'Chai', costPrice: 11500, sellingPrice: 15500, defaultLeadTime: 2, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'SEASONING-KNORR-400', name: 'Hạt nêm Knorr thịt thăn xương ống 400g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 32000, sellingPrice: 39000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-MASAN', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 40 },
    { sku: 'SEASONING-KNORR-900', name: 'Hạt nêm Knorr thịt thăn xương ống 900g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 65000, sellingPrice: 78000, defaultLeadTime: 2, minSafetyStock: 20, supplierCode: 'SUP-MASAN', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.CRITICAL, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 22 },
    { sku: 'SEASONING-AJINGON', name: 'Hạt nêm Aji-ngon heo gói 400g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 28500, sellingPrice: 35000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-MASAN', moq: 20, packSize: 20, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'MSG-AJINOMOTO-454', name: 'Bột ngọt Ajinomoto hạt lớn gói 454g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 30000, sellingPrice: 36500, defaultLeadTime: 3, minSafetyStock: 30, supplierCode: 'SUP-MASAN', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 35 },
    { sku: 'MSG-VEDAN-454', name: 'Bột ngọt Vedan gói 454g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 26000, sellingPrice: 32000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-MASAN', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 15 },
    { sku: 'SUGAR-BIENHOA-1KG', name: 'Đường tinh luyện Biên Hòa Pure gói 1kg', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 24000, sellingPrice: 29000, defaultLeadTime: 3, minSafetyStock: 30, supplierCode: 'SUP-MASAN', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 42 },
    { sku: 'SALT-IOS-VISAL', name: 'Muối sấy i-ốt cao cấp Visal 500g', category: 'Gia vị & Đồ nấu', unit: 'Gói', costPrice: 4500, sellingPrice: 6500, defaultLeadTime: 4, minSafetyStock: 40, supplierCode: 'SUP-MASAN', moq: 50, packSize: 50, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OVERSTOCK, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 18 },

    // -------------------------------------------------------------------------
    // NHÓM 5: HÓA MỸ PHẨM & CHĂM SÓC CÁ NHÂN (20 SKU - SUP-UNILEVER)
    // -------------------------------------------------------------------------
    { sku: 'DETERGENT-OMO-MATIC-3-6', name: 'Nước giặt OMO Matic chuyên gia cửa trên túi 3.6kg', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 175000, sellingPrice: 215000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 3, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 16 },
    { sku: 'DETERGENT-OMO-FRONT-3-6', name: 'Nước giặt OMO Matic cửa trước bền màu 3.6kg', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 185000, sellingPrice: 228000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 3, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 14 },
    { sku: 'DETERGENT-OMO-RED-800', name: 'Bột giặt OMO đỏ xoáy bay vết bẩn 800g', category: 'Hóa mỹ phẩm', unit: 'Gói', costPrice: 38000, sellingPrice: 46000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 20 },
    { sku: 'DETERGENT-ARIEL-3-2', name: 'Nước giặt Ariel Matic khử mùi ẩm mốc túi 3.2kg', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 170000, sellingPrice: 210000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 3, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 12 },
    { sku: 'FABRIC-COMFORT-3-2L', name: 'Nước xả vải Comfort hương nước hoa thiên nhiên túi 3.2L', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 168000, sellingPrice: 205000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 3, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 15 },
    { sku: 'FABRIC-DOWNY-3L', name: 'Nước xả vải Downy hương nắng mai túi 3L', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 165000, sellingPrice: 202000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 3, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 14 },
    { sku: 'DISHWASH-SUNLIGHT-LEMON', name: 'Nước rửa chén Sunlight chanh sạch dầu mỡ túi 750g', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 23000, sellingPrice: 29000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-UNILEVER', moq: 15, packSize: 15, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'DISHWASH-SUNLIGHT-TEA', name: 'Nước rửa chén Sunlight trà xanh matcha túi 750g', category: 'Hóa mỹ phẩm', unit: 'Túi', costPrice: 24000, sellingPrice: 30000, defaultLeadTime: 2, minSafetyStock: 25, supplierCode: 'SUP-UNILEVER', moq: 15, packSize: 15, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 28 },
    { sku: 'FLOOR-SUNLIGHT-LILY', name: 'Nước lau sàn Sunlight hương hoa hạ & lily chai 1kg', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 25000, sellingPrice: 32000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 22 },
    { sku: 'FLOOR-SUNLIGHT-LEMON', name: 'Nước lau sàn Sunlight hương chanh sả đuổi côn trùng 1kg', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 25000, sellingPrice: 32000, defaultLeadTime: 3, minSafetyStock: 15, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'TOILET-VIM-BLUE', name: 'Nước tẩy bồn cầu và nhà tắm VIM diệt khuẩn xanh 880ml', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 32000, sellingPrice: 39500, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'SHAMPOO-CLEAR-MEN', name: 'Dầu gội sạch gàu Clear Men Cool Sport bạc hà chai 630g', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 145000, sellingPrice: 179000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 10 },
    { sku: 'SHAMPOO-SUNSILK-650', name: 'Dầu gội Sunsilk óng mượt rạng ngời chai 650g', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 125000, sellingPrice: 155000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.CRITICAL, abcTarget: 'A', xyzTarget: 'Y', baseDailySales: 11 },
    { sku: 'SHAMPOO-PANTENE-650', name: 'Dầu gội Pantene ngăn rụng tóc chai 650g', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 135000, sellingPrice: 165000, defaultLeadTime: 3, minSafetyStock: 10, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 8 },
    { sku: 'SHOWER-GEL-LIFEBUOY', name: 'Sữa tắm Lifebuoy bảo vệ vượt trội đỏ chai 850g', category: 'Hóa mỹ phẩm', unit: 'Chai', costPrice: 140000, sellingPrice: 172000, defaultLeadTime: 3, minSafetyStock: 12, supplierCode: 'SUP-UNILEVER', moq: 6, packSize: 6, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 12 },
    { sku: 'SOAP-LIFEBUOY-RED', name: 'Xà bông cục Lifebuoy đỏ bảo vệ da 90g', category: 'Hóa mỹ phẩm', unit: 'Cục', costPrice: 12000, sellingPrice: 16000, defaultLeadTime: 3, minSafetyStock: 36, supplierCode: 'SUP-UNILEVER', moq: 36, packSize: 36, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 20 },
    { sku: 'TOOTHPASTE-PS-180', name: 'Kem đánh răng P/S bảo vệ 123 chăm sóc toàn diện 180g', category: 'Hóa mỹ phẩm', unit: 'Tuýp', costPrice: 28000, sellingPrice: 35000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-UNILEVER', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'TOOTHPASTE-COLGATE', name: 'Kem đánh răng Colgate Total than hoạt tính 150g', category: 'Hóa mỹ phẩm', unit: 'Tuýp', costPrice: 38000, sellingPrice: 47000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.OUT_OF_STOCK, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 12 },
    { sku: 'TOOTHBRUSH-COLGATE', name: 'Bàn chải đánh răng Colgate Slim Soft than hoạt tính', category: 'Hóa mỹ phẩm', unit: 'Cây', costPrice: 26000, sellingPrice: 34000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-UNILEVER', moq: 12, packSize: 12, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 9 },
    { sku: 'TISSUE-PULPPY-10R', name: 'Giấy vệ sinh lụa cao cấp Pulppy lốc 10 cuộn 3 lớp', category: 'Hóa mỹ phẩm', unit: 'Lốc', costPrice: 78000, sellingPrice: 96000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-UNILEVER', moq: 10, packSize: 5, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 16 },

    // -------------------------------------------------------------------------
    // NHÓM 6: BÁNH KẸO & ĂN VẶT (20 SKU - SUP-KINHDO)
    // -------------------------------------------------------------------------
    { sku: 'BISCUIT-COSY-MARIE', name: 'Bánh quy sữa Cosy Marie Kinh Đô gói 336g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 32000, sellingPrice: 40000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'BISCUIT-COSY-SESAME', name: 'Bánh quy mè Cosy giòn rụm gói 288g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 30000, sellingPrice: 38000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 15 },
    { sku: 'BISCUIT-OREO-VANILLA', name: 'Bánh quy socola kẹp kem vani Oreo thanh 133g', category: 'Bánh kẹo & Ăn vặt', unit: 'Thanh', costPrice: 14000, sellingPrice: 18500, defaultLeadTime: 3, minSafetyStock: 30, supplierCode: 'SUP-KINHDO', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 25 },
    { sku: 'BISCUIT-OREO-CHOCO', name: 'Bánh quy socola kẹp kem socola Oreo thanh 133g', category: 'Bánh kẹo & Ăn vặt', unit: 'Thanh', costPrice: 14000, sellingPrice: 18500, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-KINHDO', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'CAKE-CHOCOPIE-ORION', name: 'Bánh Chocopie Orion hộp 12 cái 360g', category: 'Bánh kẹo & Ăn vặt', unit: 'Hộp', costPrice: 45000, sellingPrice: 56000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 26 },
    { sku: 'CAKE-CHOCOPIE-DARK', name: 'Bánh Chocopie Dark Orion socola đậm hộp 12 cái', category: 'Bánh kẹo & Ăn vặt', unit: 'Hộp', costPrice: 48000, sellingPrice: 59000, defaultLeadTime: 3, minSafetyStock: 16, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.WARNING, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 14 },
    { sku: 'CAKE-CUSTAS-ORION', name: 'Bánh trứng Custas Orion hộp 12 cái 276g', category: 'Bánh kẹo & Ăn vặt', unit: 'Hộp', costPrice: 52000, sellingPrice: 65000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'X', baseDailySales: 20 },
    { sku: 'CAKE-SOLITE-ROLL', name: 'Bánh cuộn kem Solite hương dâu hộp 360g', category: 'Bánh kẹo & Ăn vặt', unit: 'Hộp', costPrice: 41000, sellingPrice: 51000, defaultLeadTime: 3, minSafetyStock: 16, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 15 },
    { sku: 'SNACK-OISHI-TOM', name: 'Bánh snack phồng tôm Oishi gói 40g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 5000, sellingPrice: 7000, defaultLeadTime: 2, minSafetyStock: 40, supplierCode: 'SUP-KINHDO', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 45 },
    { sku: 'SNACK-OISHI-BAP', name: 'Bánh snack bắp ngọt nướng Oishi gói 40g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 5000, sellingPrice: 7000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-KINHDO', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'SNACK-LAYS-NATURAL', name: 'Khoai tây sấy giòn Lay\'s vị tự nhiên gói 56g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 11000, sellingPrice: 15000, defaultLeadTime: 2, minSafetyStock: 30, supplierCode: 'SUP-KINHDO', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 35 },
    { sku: 'SNACK-LAYS-BBQ', name: 'Khoai tây sấy giòn Lay\'s vị thăn bò nướng BBQ 56g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 11000, sellingPrice: 15000, defaultLeadTime: 2, minSafetyStock: 25, supplierCode: 'SUP-KINHDO', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'B', xyzTarget: 'X', baseDailySales: 30 },
    { sku: 'SNACK-SWING-WAVE', name: 'Bánh khoai tây Swing vị cánh gà nướng bơ 56g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 11000, sellingPrice: 15000, defaultLeadTime: 2, minSafetyStock: 25, supplierCode: 'SUP-KINHDO', moq: 20, packSize: 20, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.CRITICAL, abcTarget: 'B', xyzTarget: 'Y', baseDailySales: 22 },
    { sku: 'CANDY-ALPENLIEBE', name: 'Kẹo ngậm sữa caramel truyền thống Alpenliebe gói 120g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 13000, sellingPrice: 17500, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-KINHDO', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 16 },
    { sku: 'CANDY-KOPICO-COFFEE', name: 'Kẹo cà phê đậm vị Kopico gói 150g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 15000, sellingPrice: 20000, defaultLeadTime: 3, minSafetyStock: 24, supplierCode: 'SUP-KINHDO', moq: 24, packSize: 24, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 18 },
    { sku: 'CANDY-DYNAMITE-MINT', name: 'Kẹo sôcôla nhân bạc hà Dynamite gói 125g', category: 'Bánh kẹo & Ăn vặt', unit: 'Gói', costPrice: 12500, sellingPrice: 16500, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-KINHDO', moq: 24, packSize: 24, tier: MaturityTier.BASIC_FORECAST, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'X', baseDailySales: 14 },
    { sku: 'JELLY-NEWCHOICE', name: 'Thạch rau câu trái cây New Choice túi 350g', category: 'Bánh kẹo & Ăn vặt', unit: 'Túi', costPrice: 19000, sellingPrice: 26000, defaultLeadTime: 3, minSafetyStock: 20, supplierCode: 'SUP-KINHDO', moq: 12, packSize: 12, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'C', xyzTarget: 'Y', baseDailySales: 15 },
    { sku: 'DRIED-BEEF-BOKHO', name: 'Thịt bò khô tẩm vị cay xé sợi đóng hũ 100g', category: 'Bánh kẹo & Ăn vặt', unit: 'Hũ', costPrice: 65000, sellingPrice: 85000, defaultLeadTime: 4, minSafetyStock: 12, supplierCode: 'SUP-KINHDO', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.NORMAL, abcTarget: 'A', xyzTarget: 'Z', baseDailySales: 6 },
    { sku: 'CASHEW-NUTS-SALT', name: 'Hạt điều rang muối vỏ lụa Bình Phước hũ 200g', category: 'Bánh kẹo & Ăn vặt', unit: 'Hũ', costPrice: 85000, sellingPrice: 110000, defaultLeadTime: 4, minSafetyStock: 12, supplierCode: 'SUP-KINHDO', moq: 10, packSize: 10, tier: MaturityTier.AI_READY, targetRisk: RiskLevel.OVERSTOCK, abcTarget: 'A', xyzTarget: 'Z', baseDailySales: 5 },
    { sku: 'GIFT-BOX-KINHDO-TET', name: 'Hộp quà Tết bánh kẹo cao cấp Kinh Đô An Lộc Phát', category: 'Bánh kẹo & Ăn vặt', unit: 'Hộp', costPrice: 280000, sellingPrice: 360000, defaultLeadTime: 5, minSafetyStock: 10, supplierCode: 'SUP-KINHDO', moq: 5, packSize: 5, tier: MaturityTier.COLD_START, targetRisk: RiskLevel.OUT_OF_STOCK, abcTarget: 'A', xyzTarget: 'Z', baseDailySales: 8 },
  ];

  console.log(`Đang nạp ${productDefs.length} sản phẩm và điều kiện cung ứng...`);

  // Lưu sản phẩm và thiết lập liên kết Supplier
  for (const p of productDefs) {
    await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        defaultLeadTime: p.defaultLeadTime,
        minSafetyStock: p.minSafetyStock,
        isActive: true,
      },
    });

    const supplierId = supplierMap.get(p.supplierCode);
    if (supplierId) {
      await prisma.productSupplier.create({
        data: {
          productSku: p.sku,
          supplierId,
          purchasePrice: p.costPrice,
          moq: p.moq,
          packSize: p.packSize,
          committedLeadTime: p.defaultLeadTime,
          isPreferred: true,
        },
      });
    }
  }

  // ===========================================================================
  // 6. TỰ ĐỘNG SINH 90 NGÀY LỊCH SỬ BÁN HÀNG THEO MÔ HÌNH CHUỖI THỜI GIAN
  // ===========================================================================
  console.log('📈 Đang tạo chuỗi thời gian lịch sử bán hàng 90 ngày (Weekly Seasonality s=7)...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const salesHistoryBatch: Array<{
    productSku: string;
    saleDate: Date;
    quantitySold: number;
    revenue: number;
    source: string;
  }> = [];

  for (const p of productDefs) {
    let daysToGenerate = 90;
    if (p.tier === MaturityTier.COLD_START) {
      daysToGenerate = 5; // Dưới 14 ngày
    } else if (p.tier === MaturityTier.BASIC_FORECAST) {
      daysToGenerate = 20; // Từ 14 đến 30 ngày
    }

    for (let dayOffset = daysToGenerate; dayOffset >= 1; dayOffset--) {
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - dayOffset);
      const dayOfWeek = saleDate.getDay(); // 0 = Chủ Nhật, 6 = Thứ Bảy

      let seasonalFactor = 1.0;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        seasonalFactor = 1.45; // Cuối tuần tăng 45% lượng bán
      } else if (dayOfWeek === 5) {
        seasonalFactor = 1.2;  // Thứ Sáu tăng 20%
      }

      let noise = (Math.sin(dayOffset * 0.5) * 0.15) + ((Math.random() - 0.5) * 0.2);
      let qty = Math.round(p.baseDailySales * seasonalFactor * (1.0 + noise));

      // Xử lý nhóm XYZ:
      if (p.xyzTarget === 'Z') {
        // Nhóm Z biến động mạnh, nhiều ngày bằng 0
        if (Math.random() < 0.45) {
          qty = 0;
        } else {
          qty = Math.round(qty * (1.5 + Math.random()));
        }
      } else if (p.xyzTarget === 'Y') {
        qty = Math.round(qty * (0.8 + Math.random() * 0.4));
      }

      qty = Math.max(0, qty);
      const revenue = Math.round(qty * p.sellingPrice);

      salesHistoryBatch.push({
        productSku: p.sku,
        saleDate,
        quantitySold: qty,
        revenue,
        source: 'SEED_PHASE6',
      });
    }

    // Nếu là COLD_START, tạo thêm bản ghi cold_start_inputs (BR-006)
    if (p.tier === MaturityTier.COLD_START) {
      await prisma.coldStartInput.create({
        data: {
          productSku: p.sku,
          historyDaysCount: daysToGenerate,
          expectedDailySales: Math.round(p.baseDailySales),
          notes: 'Ước lượng ban đầu khi mở bán mặt hàng mới theo UC-008',
          updatedBy: admin.id,
        },
      });
    }
  }

  // Insert sales history theo batch 1000 dòng để tối ưu tốc độ
  const BATCH_SIZE = 1000;
  for (let i = 0; i < salesHistoryBatch.length; i += BATCH_SIZE) {
    const chunk = salesHistoryBatch.slice(i, i + BATCH_SIZE);
    await prisma.salesHistory.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  console.log(`✅ Đã nạp thành công ${salesHistoryBatch.length} bản ghi lịch sử bán hàng.`);

  // ===========================================================================
  // 7. KHỞI TẠO TỒN KHO & CÁC CHỈ SỐ DSS PHÂN BỔ 5 CẤP RỦI RO (BR-002, BR-005)
  // ===========================================================================
  console.log('📊 Tính toán và phân bổ 5 cấp độ rủi ro tồn kho (Out of Stock, Critical, Warning, Normal, Overstock)...');

  for (const p of productDefs) {
    const avgDaily = p.baseDailySales;
    const ss = Math.max(p.minSafetyStock, Math.round(1.65 * (avgDaily * 0.25) * Math.sqrt(p.defaultLeadTime)));
    const rop = Math.round((avgDaily * p.defaultLeadTime) + ss);
    const maxStock = Math.round(rop + (avgDaily * 30));

    let onHand = 0;
    let daysOfSupply = 0;
    let riskLevel = p.targetRisk;

    switch (p.targetRisk) {
      case RiskLevel.OUT_OF_STOCK:
        onHand = 0;
        daysOfSupply = 0;
        break;
      case RiskLevel.CRITICAL:
        onHand = Math.max(1, Math.round(avgDaily * (1 + Math.random())));
        daysOfSupply = Number((onHand / avgDaily).toFixed(1));
        break;
      case RiskLevel.WARNING:
        onHand = Math.round(rop * 0.9);
        daysOfSupply = Number((onHand / avgDaily).toFixed(1));
        break;
      case RiskLevel.NORMAL:
        onHand = Math.round(rop + (avgDaily * 12));
        daysOfSupply = Number((onHand / avgDaily).toFixed(1));
        break;
      case RiskLevel.OVERSTOCK:
        onHand = Math.round(maxStock * 1.35);
        daysOfSupply = Number((onHand / avgDaily).toFixed(1));
        break;
    }

    const isDeadStock = p.targetRisk === RiskLevel.OVERSTOCK && p.xyzTarget === 'Z';
    await prisma.$executeRawUnsafe(`
      INSERT INTO inventory (product_sku, on_hand, on_order, safety_stock, reorder_point, max_stock, days_of_supply, risk_level, is_dead_stock)
      VALUES ('${p.sku}', ${onHand}, 0, ${ss}, ${rop}, ${maxStock}, ${daysOfSupply}, '${riskLevel}', ${isDeadStock})
      ON CONFLICT (product_sku) DO UPDATE SET 
        on_hand = EXCLUDED.on_hand,
        safety_stock = EXCLUDED.safety_stock,
        reorder_point = EXCLUDED.reorder_point,
        max_stock = EXCLUDED.max_stock,
        days_of_supply = EXCLUDED.days_of_supply,
        risk_level = EXCLUDED.risk_level,
        is_dead_stock = EXCLUDED.is_dead_stock;
    `);
  }

  // ===========================================================================
  // 8. KHỞI TẠO LỊCH SỬ GIAO HÀNG & TÍNH ĐIỂM ĐÁNH GIÁ NHÀ CUNG CẤP (BR-012, BR-013)
  // ===========================================================================
  console.log('🚚 Tạo 30 đơn giao hàng quá khứ và bảng điểm năng lực Nhà cung cấp...');

  const supplierPerformanceTargets: Record<string, { otif: number; quality: number; price: number; leadTime: number }> = {
    'SUP-VINAMILK': { otif: 94.5, quality: 96.0, price: 92.0, leadTime: 95.0 },
    'SUP-HEINEKEN': { otif: 91.0, quality: 98.0, price: 88.0, leadTime: 90.0 },
    'SUP-MASAN': { otif: 88.5, quality: 92.0, price: 95.0, leadTime: 87.0 },
    'SUP-ACECOOK': { otif: 97.0, quality: 95.0, price: 96.0, leadTime: 98.0 },
    'SUP-UNILEVER': { otif: 85.0, quality: 94.0, price: 86.0, leadTime: 84.0 },
    'SUP-KINHDO': { otif: 78.0, quality: 88.0, price: 82.0, leadTime: 75.0 },
  };

  let poCounter = 1;
  for (const [code, supId] of supplierMap.entries()) {
    const perf = supplierPerformanceTargets[code] || { otif: 85, quality: 90, price: 90, leadTime: 85 };

    // Tạo 5 đơn PO lịch sử đã hoàn tất cho mỗi NCC
    for (let i = 1; i <= 5; i++) {
      const daysAgo = (5 - i) * 6 + 3;
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - daysAgo);

      const promisedDate = new Date(orderDate);
      promisedDate.setDate(orderDate.getDate() + 3);

      const actualDate = new Date(promisedDate);
      // Giả lập giao trễ 1 ngày nếu không đạt 100% on-time
      const isLate = Math.random() > (perf.otif / 100);
      if (isLate) {
        actualDate.setDate(promisedDate.getDate() + 1);
      }

      const datePart = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      const poCode = `PO-${datePart}-${String(poCounter).padStart(4, '0')}`;
      poCounter++;

      const po = await prisma.purchaseOrder.create({
        data: {
          poCode,
          supplierId: supId,
          status: POStatus.RECEIVED,
          orderDate,
          promisedDeliveryDate: promisedDate,
          actualDeliveryDate: actualDate,
          totalAmount: 15000000,
          createdBy: staff.id,
          confirmedBy: admin.id,
          confirmedAt: orderDate,
        },
      });

      const totalOrdered = 100;
      const totalDelivered = 100;
      const totalDefective = isLate ? 2 : 0;
      const totalAccepted = totalDelivered - totalDefective;

      const isOnTime = !isLate;
      const isInFull = totalAccepted >= totalOrdered;
      const isOtif = isOnTime && isInFull;

      await prisma.deliveryHistory.create({
        data: {
          orderId: po.id,
          supplierId: supId,
          promisedDate,
          actualDeliveryDate: actualDate,
          totalOrderedQuantity: totalOrdered,
          totalDeliveredQuantity: totalDelivered,
          totalDefectiveQuantity: totalDefective,
          totalAcceptedQuantity: totalAccepted,
          leadTimeDays: 3,
          isOnTime,
          isInFull,
          isOtif,
          receivedBy: staff.id,
        },
      });
    }

    // Tính tổng điểm đánh giá theo BR-013
    const totalScore = (
      (perf.otif * 0.35) +
      (perf.quality * 0.30) +
      (perf.price * 0.20) +
      (perf.leadTime * 0.15)
    );

    await prisma.supplierEvaluation.create({
      data: {
        supplierId: supId,
        evaluationDate: today,
        deliveryCountAnalyzed: 5,
        otifScore: perf.otif,
        qualityScore: perf.quality,
        priceScore: perf.price,
        leadTimeScore: perf.leadTime,
        totalScore: Number(totalScore.toFixed(2)),
        isNewSupplier: false,
      },
    });
  }

  // ===========================================================================
  // 9. TỰ ĐỘNG CHẠY PHÂN TÍCH DSS, MA TRẬN ABC-XYZ VÀ SINH KHUYẾN NGHỊ MUA HÀNG
  // ===========================================================================
  console.log('🧠 [DSS] Đang tự động chạy phân tích DSS, phân loại ABC-XYZ và sinh khuyến nghị...');
  const dssResult = await runDssAnalysisUseCase.execute();
  console.log(`✅ [DSS] Phân tích hoàn tất: ${dssResult.skusAnalyzed} SKU đã phân tích, ${dssResult.recommendationsCount} khuyến nghị mua hàng được tạo mới!`);

  console.log('🤖 [FORECAST] Đang nạp sẵn dự báo cho cả 3 chu kỳ (7, 14, 30 ngày)...');
  const fcResult = await generateForecastsUseCase.execute();
  console.log(`✅ [FORECAST] Dự báo hoàn tất: ${fcResult.skusAnalyzed} SKU cho các chu kỳ ${fcResult.horizonsGenerated.join(', ')} ngày!`);

  console.log('🎉 [PHASE 6] SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG!');
  console.log('------------------------------------------------------------');
  console.log(`• Tổng SKU tạo mới:        120 SKU (6 ngành hàng FMCG)`);
  console.log(`• Tổng Nhà cung cấp:       6 NCC`);
  console.log(`• Bản ghi lịch sử bán:     ${salesHistoryBatch.length} dòng (90 ngày)`);
  console.log(`• Đơn nhận hàng lịch sử:   30 đơn (OTIF / Delivery History)`);
  console.log(`• Khuyến nghị mua hàng AI: ${dssResult.recommendationsCount} đề xuất (Đã tính ROP, SS, NCC tối ưu)`);
  console.log(`• Phân tích Ma trận:       Đầy đủ 120 SKU trong 9 ô ABC-XYZ`);
  console.log(`• Tài khoản quản trị viên: admin / Admin@123`);
  console.log(`• Tài khoản nhân viên:     staff / Staff@123`);
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo dữ liệu Phase 6:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
