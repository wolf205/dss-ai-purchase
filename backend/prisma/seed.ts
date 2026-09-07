import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Khởi tạo tài khoản Quản trị viên mặc định (admin / Admin@123)
  const adminId = 'a0000000-0000-0000-0000-000000000001';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: adminId,
      username: 'admin',
      passwordHash,
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@dss-purchase.local',
      role: UserRole.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`✅ Default admin account verified: ${admin.username} (${admin.id})`);

  // 2. Khởi tạo cấu hình trọng số đánh giá Nhà cung cấp mặc định (BR-013)
  const weights = await prisma.supplierEvaluationWeight.upsert({
    where: { id: 1 },
    update: {
      weightOtif: 35.00,
      weightQuality: 30.00,
      weightPrice: 20.00,
      weightLeadtime: 15.00,
      updatedBy: admin.id,
    },
    create: {
      id: 1,
      weightOtif: 35.00,
      weightQuality: 30.00,
      weightPrice: 20.00,
      weightLeadtime: 15.00,
      updatedBy: admin.id,
    },
  });

  console.log(`✅ Supplier evaluation weights verified (OTIF: ${weights.weightOtif}%, Quality: ${weights.weightQuality}%, Price: ${weights.weightPrice}%, LeadTime: ${weights.weightLeadtime}%)`);

  // 3. Khởi tạo Nhà cung cấp mẫu
  const supVinamilk = await prisma.supplier.upsert({
    where: { code: 'SUP-VINAMILK' },
    update: {},
    create: {
      code: 'SUP-VINAMILK',
      name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      phone: '02854155555',
      email: 'contact@vinamilk.com.vn',
      statusTag: 'ACTIVE',
      isActive: true,
    },
  });

  const supHeineken = await prisma.supplier.upsert({
    where: { code: 'SUP-HEINEKEN' },
    update: {},
    create: {
      code: 'SUP-HEINEKEN',
      name: 'Công ty TNHH Nhà Máy Bia HEINEKEN Việt Nam',
      phone: '02838222755',
      email: 'contact@heineken.vn',
      statusTag: 'ACTIVE',
      isActive: true,
    },
  });

  console.log(`✅ Default suppliers verified: ${supVinamilk.code}, ${supHeineken.code}`);

  // 4. Khởi tạo danh mục Sản phẩm mẫu & Tồn kho ban đầu
  const sampleProducts = [
    {
      sku: 'MILK-VNM-180',
      name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 5500,
      sellingPrice: 7500,
      defaultLeadTime: 3,
      minSafetyStock: 20,
      supplierId: supVinamilk.id,
      purchasePrice: 5500,
      initialOnHand: 48,
    },
    {
      sku: 'BEER-TIGER-330',
      name: 'Bia Tiger lon 330ml (Thùng 24 lon)',
      category: 'Đồ uống & Giải khát',
      unit: 'Thùng',
      costPrice: 340000,
      sellingPrice: 385000,
      defaultLeadTime: 4,
      minSafetyStock: 15,
      supplierId: supHeineken.id,
      purchasePrice: 340000,
      initialOnHand: 30,
    },
    {
      sku: 'NOODLE-HAOHAO-75',
      name: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
      category: 'Thực phẩm khô',
      unit: 'Gói',
      costPrice: 3800,
      sellingPrice: 4800,
      defaultLeadTime: 2,
      minSafetyStock: 50,
      supplierId: supVinamilk.id,
      purchasePrice: 3800,
      initialOnHand: 150,
    },
    {
      sku: 'YOGURT-TH-100',
      name: 'Sữa chua ăn TH True Yogurt 100g',
      category: 'Sữa & Bơ sữa',
      unit: 'Hộp',
      costPrice: 6000,
      sellingPrice: 8000,
      defaultLeadTime: 3,
      minSafetyStock: 25,
      supplierId: supVinamilk.id,
      purchasePrice: 6000,
      initialOnHand: 60,
    },
    {
      sku: 'COOKING-OIL-NEPTUNE-1L',
      name: 'Dầu ăn thượng hạng Neptune Gold 1 Lít',
      category: 'Gia vị & Đồ nấu',
      unit: 'Chai',
      costPrice: 48000,
      sellingPrice: 56000,
      defaultLeadTime: 3,
      minSafetyStock: 15,
      supplierId: supVinamilk.id,
      purchasePrice: 48000,
      initialOnHand: 25,
    },
  ];

  for (const item of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        sku: item.sku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        defaultLeadTime: item.defaultLeadTime,
        minSafetyStock: item.minSafetyStock,
        isActive: true,
      },
    });

    await prisma.$executeRawUnsafe(`
      INSERT INTO inventory (product_sku, on_hand, on_order, safety_stock, reorder_point, max_stock, days_of_supply, risk_level)
      VALUES ('${item.sku}', ${item.initialOnHand}, 0, ${item.minSafetyStock}, ${Math.round(item.minSafetyStock * 1.5)}, ${item.minSafetyStock * 4}, 10.0, 'NORMAL')
      ON CONFLICT (product_sku) DO UPDATE SET on_hand = EXCLUDED.on_hand;
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO product_suppliers (product_sku, supplier_id, purchase_price, moq, pack_size, committed_lead_time, is_preferred)
      VALUES ('${item.sku}', ${item.supplierId}, ${item.purchasePrice}, 12, 6, ${item.defaultLeadTime}, true)
      ON CONFLICT (product_sku, supplier_id) DO NOTHING;
    `);
  }

  console.log(`✅ Sample products & inventory initialized (${sampleProducts.length} items)`);

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
