import { PrismaClient } from '@prisma/client';
import { CreatePurchaseOrderUseCase } from '../../src/application/use-cases/purchase-orders/CreatePurchaseOrderUseCase';
import { ConfirmPurchaseOrderUseCase } from '../../src/application/use-cases/purchase-orders/ConfirmPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from '../../src/application/use-cases/purchase-orders/CancelPurchaseOrderUseCase';
import { PrismaPurchaseOrderRepository } from '../../src/infrastructure/repositories/PrismaPurchaseOrderRepository';
import { PrismaInventoryRepository } from '../../src/infrastructure/repositories/PrismaInventoryRepository';
import { PrismaProductRepository } from '../../src/infrastructure/repositories/PrismaProductRepository';
import { PrismaSupplierRepository } from '../../src/infrastructure/repositories/PrismaSupplierRepository';
import { PrismaUnitOfWork } from '../../src/infrastructure/database/PrismaUnitOfWork';
import { DomainException } from '../../src/domain/exceptions/DomainException';

const prisma = new PrismaClient();

describe('Purchase Order Lifecycle & Invariants Integration Tests (UC-012, UC-013, BR-001, BR-024, BR-025)', () => {
  const poRepo = new PrismaPurchaseOrderRepository();
  const invRepo = new PrismaInventoryRepository();
  const prodRepo = new PrismaProductRepository();
  const supRepo = new PrismaSupplierRepository();
  const uow = new PrismaUnitOfWork();

  const createUseCase = new CreatePurchaseOrderUseCase(poRepo, supRepo, prodRepo, uow);
  const confirmUseCase = new ConfirmPurchaseOrderUseCase(poRepo, invRepo, uow);
  const cancelUseCase = new CancelPurchaseOrderUseCase(poRepo, invRepo, uow);

  const testSku = 'BEER-TIGER-330';
  let supplierId: bigint;
  let adminId: string;
  let staffId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const staff = await prisma.user.findUnique({ where: { username: 'staff' } });
    const supplier = await prisma.supplier.findFirst({ where: { code: 'SUP-HEINEKEN' } });

    if (!admin || !staff || !supplier) {
      throw new Error('Database must be seeded before running integration tests (run npm run seed:phase6)');
    }

    adminId = admin.id;
    staffId = staff.id;
    supplierId = supplier.id;
  });

  afterEach(async () => {
    await prisma.purchaseOrderItem.deleteMany({ where: { order: { poCode: { startsWith: 'PO-' } }, productSku: testSku } });
    await prisma.purchaseOrder.deleteMany({ where: { supplierId, notes: { contains: 'LIFECYCLE_TEST' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Full Flow: DRAFT -> ORDERED (On-Order increases) -> CANCELLED (On-Order decreases)', async () => {
    // 1. Arrange: Reset inventory On-Order
    await prisma.$executeRawUnsafe(`
      UPDATE inventory 
      SET on_order = 0 
      WHERE product_sku = '${testSku}';
    `);

    const promisedDate = new Date();
    promisedDate.setDate(promisedDate.getDate() + 3);

    // 2. Act: Create PO in DRAFT state
    const createdPo = await createUseCase.execute({
      supplierId,
      promisedDeliveryDate: promisedDate,
      notes: 'LIFECYCLE_TEST: Initial Draft',
      createdBy: staffId,
      items: [
        {
          productSku: testSku,
          orderedQuantity: 10,
          unitPrice: 345000,
        },
      ],
    });

    expect(createdPo.status).toBe('DRAFT');
    expect(createdPo.poCode).toMatch(/^PO-\d{8}-[A-Z0-9]{4}$/);

    // Assert: In DRAFT state, On-Order is NOT yet incremented
    const invDraft = await prisma.inventory.findUnique({ where: { productSku: testSku } });
    expect(invDraft!.onOrder).toBe(0);

    // 3. Act: Confirm PO -> transitions to ORDERED
    const confirmedPo = await confirmUseCase.execute({
      poId: BigInt(createdPo.id!),
      confirmedBy: adminId,
    });

    expect(confirmedPo.status).toBe('ORDERED');

    // Assert: In ORDERED state, On-Order is atomically increased by 10 (BR-001)
    const invOrdered = await prisma.inventory.findUnique({ where: { productSku: testSku } });
    expect(invOrdered!.onOrder).toBe(10);

    // 4. Act: Cancel PO -> transitions to CANCELLED
    const cancelledPo = await cancelUseCase.execute({
      poId: BigInt(createdPo.id!),
      cancelledBy: adminId,
      reason: 'Nhà cung cấp báo hết hàng tạm thời',
    });

    expect(cancelledPo.status).toBe('CANCELLED');

    // Assert: In CANCELLED state, On-Order is rolled back (decreased by 10 back to 0)
    const invCancelled = await prisma.inventory.findUnique({ where: { productSku: testSku } });
    expect(invCancelled!.onOrder).toBe(0);
  });

  it('State Machine Invariant: Cannot cancel a DRAFT PO directly without being ORDERED first', async () => {
    const promisedDate = new Date();
    promisedDate.setDate(promisedDate.getDate() + 3);

    const draftPo = await createUseCase.execute({
      supplierId,
      promisedDeliveryDate: promisedDate,
      notes: 'LIFECYCLE_TEST: Draft check',
      createdBy: staffId,
      items: [
        {
          productSku: testSku,
          orderedQuantity: 5,
          unitPrice: 345000,
        },
      ],
    });

    // Attempt to cancel directly from DRAFT
    await expect(
      cancelUseCase.execute({
        poId: BigInt(draftPo.id!),
        cancelledBy: adminId,
        reason: 'Hủy nháp',
      })
    ).rejects.toThrow(DomainException);
  });
});
