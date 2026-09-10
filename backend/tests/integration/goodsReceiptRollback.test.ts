import { PrismaClient, POStatus } from '@prisma/client';
import { ReceiveGoodsUseCase } from '../../src/application/use-cases/purchase-orders/ReceiveGoodsUseCase';
import { PrismaPurchaseOrderRepository } from '../../src/infrastructure/repositories/PrismaPurchaseOrderRepository';
import { PrismaInventoryRepository } from '../../src/infrastructure/repositories/PrismaInventoryRepository';
import { PrismaDeliveryHistoryRepository } from '../../src/infrastructure/repositories/PrismaDeliveryHistoryRepository';
import { PrismaUnitOfWork } from '../../src/infrastructure/database/PrismaUnitOfWork';
import { DomainException } from '../../src/domain/exceptions/DomainException';

const prisma = new PrismaClient();

describe('Goods Receipt Atomic Transaction & Rollback Integration Tests (UC-014, BR-017, BR-018)', () => {
  const poRepo = new PrismaPurchaseOrderRepository();
  const invRepo = new PrismaInventoryRepository();
  const delivRepo = new PrismaDeliveryHistoryRepository();
  const uow = new PrismaUnitOfWork();

  const useCase = new ReceiveGoodsUseCase(poRepo, invRepo, delivRepo, uow);

  const testSku = 'MILK-VNM-180';
  let supplierId: bigint;
  let adminId: string;
  let staffId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const staff = await prisma.user.findUnique({ where: { username: 'staff' } });
    const supplier = await prisma.supplier.findFirst({ where: { code: 'SUP-VINAMILK' } });

    if (!admin || !staff || !supplier) {
      throw new Error('Database must be seeded before running integration tests (run npm run seed:phase6)');
    }

    adminId = admin.id;
    staffId = staff.id;
    supplierId = supplier.id;
  });

  function getUniquePoCode(): string {
    const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase();
    return `PO-20260907-${hex}`;
  }

  afterEach(async () => {
    await prisma.deliveryHistory.deleteMany({ where: { order: { poCode: { startsWith: 'PO-20260907-' } } } });
    await prisma.purchaseOrderItem.deleteMany({ where: { order: { poCode: { startsWith: 'PO-20260907-' } } } });
    await prisma.purchaseOrder.deleteMany({ where: { poCode: { startsWith: 'PO-20260907-' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Happy Path: Should atomically receive goods, update inventory On-Hand (+), On-Order (-), PO status and create DeliveryHistory', async () => {
    // 1. Arrange: Setup initial inventory state
    await prisma.$executeRawUnsafe(`
      UPDATE inventory 
      SET on_hand = 100, on_order = 48 
      WHERE product_sku = '${testSku}';
    `);

    const orderDate = new Date();
    const promisedDate = new Date();
    promisedDate.setDate(promisedDate.getDate() + 2);

    const testPo = await prisma.purchaseOrder.create({
      data: {
        poCode: getUniquePoCode(),
        supplierId,
        status: POStatus.ORDERED,
        orderDate,
        promisedDeliveryDate: promisedDate,
        totalAmount: 297600,
        createdBy: staffId,
        confirmedBy: adminId,
        confirmedAt: orderDate,
        items: {
          create: [
            {
              productSku: testSku,
              orderedQuantity: 48,
              unitPrice: 6200,
              totalPrice: 297600,
            },
          ],
        },
      },
      include: { items: true },
    });

    // 2. Act: Execute receipt with full delivery (48 accepted)
    const actualDeliveryDate = new Date();
    const result = await useCase.execute({
      poId: testPo.id,
      actualDeliveryDate,
      receivedBy: staffId,
      notes: 'Giao hàng đầy đủ đúng hạn',
      items: [
        {
          productSku: testSku,
          deliveredQuantity: 48,
          defectiveQuantity: 0,
        },
      ],
    });

    // 3. Assert: PO state changed to RECEIVED
    expect(result.status).toBe('RECEIVED');
    expect(result.items[0].acceptedQuantity).toBe(48);

    // Assert: In Database, On-Order decreased by 48, On-Hand increased by 48
    const updatedInv = await prisma.inventory.findUnique({
      where: { productSku: testSku },
    });

    expect(updatedInv).toBeDefined();
    expect(updatedInv!.onHand).toBe(148); // 100 + 48
    expect(updatedInv!.onOrder).toBe(0);   // 48 - 48

    // Assert: DeliveryHistory record created with OTIF = true
    const delivery = await prisma.deliveryHistory.findFirst({
      where: { orderId: testPo.id },
    });
    expect(delivery).toBeDefined();
    expect(delivery!.totalOrderedQuantity).toBe(48);
    expect(delivery!.totalAcceptedQuantity).toBe(48);
    expect(delivery!.isOtif).toBe(true);

    // Clean up test PO
    await prisma.deliveryHistory.deleteMany({ where: { orderId: testPo.id } });
    await prisma.purchaseOrderItem.deleteMany({ where: { orderId: testPo.id } });
    await prisma.purchaseOrder.delete({ where: { id: testPo.id } });
  });

  it('Rollback Test: Should roll back entire transaction if an error occurs during receipt', async () => {
    // 1. Arrange: Setup initial state
    await prisma.$executeRawUnsafe(`
      UPDATE inventory 
      SET on_hand = 100, on_order = 48 
      WHERE product_sku = '${testSku}';
    `);

    const orderDate = new Date();
    const promisedDate = new Date();
    promisedDate.setDate(promisedDate.getDate() + 2);

    const testPo = await prisma.purchaseOrder.create({
      data: {
        poCode: getUniquePoCode(),
        supplierId,
        status: POStatus.ORDERED,
        orderDate,
        promisedDeliveryDate: promisedDate,
        totalAmount: 297600,
        createdBy: staffId,
        confirmedBy: adminId,
        confirmedAt: orderDate,
        items: {
          create: [
            {
              productSku: testSku,
              orderedQuantity: 48,
              unitPrice: 6200,
              totalPrice: 297600,
            },
          ],
        },
      },
    });

    // Spy on deliveryHistoryRepo.save to simulate unexpected database crash
    const delivSpy = jest.spyOn(delivRepo, 'save').mockImplementationOnce(async () => {
      throw new Error('SIMULATED_DB_CRASH_DURING_DELIVERY_INSERT');
    });

    // 2. Act: Attempt to receive goods, expecting error
    await expect(
      useCase.execute({
        poId: testPo.id,
        actualDeliveryDate: new Date(),
        receivedBy: staffId,
        items: [
          {
            productSku: testSku,
            deliveredQuantity: 48,
            defectiveQuantity: 0,
          },
        ],
      })
    ).rejects.toThrow('SIMULATED_DB_CRASH_DURING_DELIVERY_INSERT');

    delivSpy.mockRestore();

    // 3. Assert: Rollback verified!
    // In database, PO status must STILL be ORDERED
    const poAfterFail = await prisma.purchaseOrder.findUnique({
      where: { id: testPo.id },
    });
    expect(poAfterFail!.status).toBe(POStatus.ORDERED);

    // Inventory must NOT be modified (still onHand = 100, onOrder = 48)
    const invAfterFail = await prisma.inventory.findUnique({
      where: { productSku: testSku },
    });
    expect(invAfterFail!.onHand).toBe(100);
    expect(invAfterFail!.onOrder).toBe(48);

    // No DeliveryHistory record should exist
    const delivery = await prisma.deliveryHistory.findFirst({
      where: { orderId: testPo.id },
    });
    expect(delivery).toBeNull();

    // Clean up test PO
    await prisma.purchaseOrderItem.deleteMany({ where: { orderId: testPo.id } });
    await prisma.purchaseOrder.delete({ where: { id: testPo.id } });
  });

  it('Business Invariant (BR-018): Should reject receiving an already RECEIVED order', async () => {
    // 1. Arrange: An already received order
    const orderDate = new Date();
    const testPo = await prisma.purchaseOrder.create({
      data: {
        poCode: getUniquePoCode(),
        supplierId,
        status: POStatus.RECEIVED,
        orderDate,
        promisedDeliveryDate: orderDate,
        actualDeliveryDate: orderDate,
        totalAmount: 100000,
        createdBy: staffId,
        confirmedBy: adminId,
        confirmedAt: orderDate,
      },
    });

    // 2. Act & Assert: Should throw DomainException
    await expect(
      useCase.execute({
        poId: testPo.id,
        actualDeliveryDate: new Date(),
        receivedBy: staffId,
        items: [],
      })
    ).rejects.toThrow(DomainException);

    // Clean up
    await prisma.purchaseOrder.delete({ where: { id: testPo.id } });
  });
});
