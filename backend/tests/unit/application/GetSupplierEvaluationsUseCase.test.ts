import { GetSupplierEvaluationsUseCase } from '../../../src/application/use-cases/supplier/GetSupplierEvaluationsUseCase';
import { ISupplierRepository } from '../../../src/domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../src/domain/repositories/IDeliveryHistoryRepository';
import { ISupplierWeightConfigRepository } from '../../../src/domain/repositories/ISupplierWeightConfigRepository';
import { Supplier } from '../../../src/domain/entities/Supplier';
import { ProductSupplier } from '../../../src/domain/entities/ProductSupplier';
import { DeliveryHistory } from '../../../src/domain/entities/DeliveryHistory';
import { SupplierWeightConfig } from '../../../src/domain/entities/SupplierWeightConfig';

describe('GetSupplierEvaluationsUseCase (UC-009, BR-012, BR-013)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockDeliveryRepo: jest.Mocked<IDeliveryHistoryRepository>;
  let mockWeightRepo: jest.Mocked<ISupplierWeightConfigRepository>;
  let useCase: GetSupplierEvaluationsUseCase;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findProductSupplier: jest.fn(),
      findSuppliersByProductSku: jest.fn(),
      findAllProductSuppliers: jest.fn(),
      findProductSuppliersBySupplierId: jest.fn(),
      saveProductSupplier: jest.fn(),
      updateProductSupplier: jest.fn(),
      deleteProductSupplier: jest.fn(),
    };

    mockDeliveryRepo = {
      save: jest.fn(),
      findByOrderId: jest.fn(),
      findRecentBySupplierId: jest.fn(),
    };

    mockWeightRepo = {
      getLatest: jest.fn(),
      save: jest.fn(),
    };

    useCase = new GetSupplierEvaluationsUseCase(
      mockSupplierRepo,
      mockDeliveryRepo,
      mockWeightRepo
    );
  });

  it('should return empty array when no active suppliers exist', async () => {
    mockSupplierRepo.findAll.mockResolvedValue({ suppliers: [], total: 0 });

    const result = await useCase.execute();
    expect(result).toEqual([]);
    expect(mockSupplierRepo.findAll).toHaveBeenCalledWith({ isActive: true });
  });

  it('should calculate scores, handle new supplier, and rank correctly by totalScore descending', async () => {
    const supplier1 = new Supplier({
      id: '1',
      code: 'SUP-001',
      name: 'Nhà cung cấp 1',
      phone: '0123456789',
      statusTag: 'ACTIVE',
      isActive: true,
    });

    const supplier2 = new Supplier({
      id: '2',
      code: 'SUP-002',
      name: 'Nhà cung cấp 2 (Mới)',
      phone: '0987654321',
      statusTag: 'NEW_SUPPLIER',
      isActive: true,
    });

    mockSupplierRepo.findAll.mockResolvedValue({ suppliers: [supplier1, supplier2], total: 2 });

    mockWeightRepo.getLatest.mockResolvedValue(
      new SupplierWeightConfig({
        id: 1,
        weightPrice: 20,
        weightOtif: 35,
        weightQuality: 30,
        weightLeadtime: 15,
      })
    );

    const term1 = new ProductSupplier({
      productSku: 'SKU-A',
      supplierId: '1',
      purchasePrice: 100000,
      committedLeadTime: 5,
    });

    const term2 = new ProductSupplier({
      productSku: 'SKU-A',
      supplierId: '2',
      purchasePrice: 120000,
      committedLeadTime: 7,
    });

    mockSupplierRepo.findAllProductSuppliers.mockResolvedValue([term1, term2]);

    // Supplier 1 has 3 deliveries (>= 3 -> regular scoring)
    const d1 = new DeliveryHistory({
      orderId: 101n,
      supplierId: 1n,
      orderDate: new Date('2026-08-01'),
      promisedDate: new Date('2026-08-06'),
      actualDeliveryDate: new Date('2026-08-05'), // on time
      totalOrderedQuantity: 100,
      totalDeliveredQuantity: 100,
      totalDefectiveQuantity: 0,
      receivedBy: '00000000-0000-0000-0000-000000000001',
    });

    const d2 = new DeliveryHistory({
      orderId: 102n,
      supplierId: 1n,
      orderDate: new Date('2026-08-10'),
      promisedDate: new Date('2026-08-15'),
      actualDeliveryDate: new Date('2026-08-14'), // on time
      totalOrderedQuantity: 100,
      totalDeliveredQuantity: 100,
      totalDefectiveQuantity: 2,
      receivedBy: '00000000-0000-0000-0000-000000000001',
    });

    const d3 = new DeliveryHistory({
      orderId: 103n,
      supplierId: 1n,
      orderDate: new Date('2026-08-20'),
      promisedDate: new Date('2026-08-25'),
      actualDeliveryDate: new Date('2026-08-24'), // on time
      totalOrderedQuantity: 100,
      totalDeliveredQuantity: 100,
      totalDefectiveQuantity: 0,
      receivedBy: '00000000-0000-0000-0000-000000000001',
    });

    // Supplier 2 has only 1 delivery (< 3 -> isNewSupplier = true)
    const d4 = new DeliveryHistory({
      orderId: 104n,
      supplierId: 2n,
      orderDate: new Date('2026-08-20'),
      promisedDate: new Date('2026-08-25'),
      actualDeliveryDate: new Date('2026-08-25'),
      totalOrderedQuantity: 50,
      totalDeliveredQuantity: 50,
      totalDefectiveQuantity: 0,
      receivedBy: '00000000-0000-0000-0000-000000000001',
    });

    mockDeliveryRepo.findRecentBySupplierId.mockImplementation(async (supplierId) => {
      if (supplierId === 1n) return [d1, d2, d3];
      if (supplierId === 2n) return [d4];
      return [];
    });

    const results = await useCase.execute();

    expect(results).toHaveLength(2);
    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);

    // Supplier 1 should be regular supplier
    const evaluatedSupplier1 = results.find((r) => r.supplierId === 1);
    expect(evaluatedSupplier1).toBeDefined();
    expect(evaluatedSupplier1!.isNewSupplier).toBe(false);
    expect(evaluatedSupplier1!.deliveryCountAnalyzed).toBe(3);
    expect(evaluatedSupplier1!.scores.otifScore).toBe(100);

    // Supplier 2 should be marked as new supplier
    const evaluatedSupplier2 = results.find((r) => r.supplierId === 2);
    expect(evaluatedSupplier2).toBeDefined();
    expect(evaluatedSupplier2!.isNewSupplier).toBe(true);
    expect(evaluatedSupplier2!.deliveryCountAnalyzed).toBe(1);

    // Verify ordering by totalScore descending
    expect(results[0].totalScore).toBeGreaterThanOrEqual(results[1].totalScore);
  });

  it('should evaluate per-SKU benchmark without cross-product price contamination (BR-012)', async () => {
    // Supplier A sells cheap Milk (10k), Supplier B sells expensive Laptop (20m)
    // In cross-product benchmark, Supplier B would get (10k / 20m) * 100 = 0.05 score!
    // In per-SKU benchmark, since Supplier B is the only seller of Laptop, it should get 100 price score!
    const supplierA = new Supplier({
      id: '10',
      code: 'SUP-MILK',
      name: 'Vinamilk',
      phone: '0123456789',
      isActive: true,
    });

    const supplierB = new Supplier({
      id: '20',
      code: 'SUP-TECH',
      name: 'Tech Corp',
      phone: '0987654321',
      isActive: true,
    });

    mockSupplierRepo.findAll.mockResolvedValue({ suppliers: [supplierA, supplierB], total: 2 });
    mockWeightRepo.getLatest.mockResolvedValue(null); // Use default weights

    const milkTerm = new ProductSupplier({
      productSku: 'SKU-MILK',
      supplierId: '10',
      purchasePrice: 10000,
      committedLeadTime: 2,
    });

    const laptopTerm = new ProductSupplier({
      productSku: 'SKU-LAPTOP',
      supplierId: '20',
      purchasePrice: 20000000,
      committedLeadTime: 5,
    });

    mockSupplierRepo.findAllProductSuppliers.mockResolvedValue([milkTerm, laptopTerm]);

    // Supplier B has 3 deliveries with exact leadTimeDays preserved from DB
    const d1 = new DeliveryHistory({
      orderId: 201n,
      supplierId: 20n,
      promisedDate: new Date('2026-08-05'),
      actualDeliveryDate: new Date('2026-08-04'),
      totalOrderedQuantity: 10,
      totalDeliveredQuantity: 10,
      totalDefectiveQuantity: 0,
      leadTimeDays: 2, // Persisted lead time
      isOnTime: true,
      isInFull: true,
      isOtif: true,
      receivedBy: '00000000-0000-0000-0000-000000000001',
    });

    mockDeliveryRepo.findRecentBySupplierId.mockImplementation(async (supplierId) => {
      if (supplierId === 20n) return [d1, d1, d1];
      return [];
    });

    const results = await useCase.execute();

    const techSupplier = results.find((r) => r.supplierId === 20);
    expect(techSupplier).toBeDefined();
    // Supplier B must get 100 for price score (not 0.05!) because it is the sole provider of SKU-LAPTOP
    expect(techSupplier!.scores.priceScore).toBe(100);
    expect(techSupplier!.scores.leadTimeScore).toBe(100);
    expect(techSupplier!.scores.otifScore).toBe(100);
    expect(techSupplier!.scores.qualityScore).toBe(100);
    expect(techSupplier!.totalScore).toBe(100);
  });
});
