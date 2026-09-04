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
