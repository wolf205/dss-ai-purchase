import { GetSupplierDeliveriesUseCase } from '../../../src/application/use-cases/supplier/GetSupplierDeliveriesUseCase';
import { ISupplierRepository } from '../../../src/domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../src/domain/repositories/IDeliveryHistoryRepository';
import { Supplier } from '../../../src/domain/entities/Supplier';
import { DeliveryHistory } from '../../../src/domain/entities/DeliveryHistory';
import { EntityNotFoundException } from '../../../src/application/exceptions';

describe('GetSupplierDeliveriesUseCase (UC-009, FR-020, Docs 3.4)', () => {
  let mockSupplierRepo: jest.Mocked<ISupplierRepository>;
  let mockDeliveryRepo: jest.Mocked<IDeliveryHistoryRepository>;
  let useCase: GetSupplierDeliveriesUseCase;

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

    useCase = new GetSupplierDeliveriesUseCase(mockSupplierRepo, mockDeliveryRepo);
  });

  it('should throw EntityNotFoundException when supplier does not exist', async () => {
    mockSupplierRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('999', 10)).rejects.toThrow(EntityNotFoundException);
    expect(mockSupplierRepo.findById).toHaveBeenCalledWith('999');
    expect(mockDeliveryRepo.findRecentBySupplierId).not.toHaveBeenCalled();
  });

  it('should return empty array when supplier exists but has no delivery records (Empty State)', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-001',
      name: 'Vinamilk',
      phone: '0123456789',
      isActive: true,
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);
    mockDeliveryRepo.findRecentBySupplierId.mockResolvedValue([]);

    const result = await useCase.execute('1', 10);

    expect(result).toEqual([]);
    expect(mockSupplierRepo.findById).toHaveBeenCalledWith('1');
    expect(mockDeliveryRepo.findRecentBySupplierId).toHaveBeenCalledWith(1n, 10);
  });

  it('should successfully map and return deliveries list with poCode and dates (UC-009, Docs 3.4)', async () => {
    const mockSupplier = new Supplier({
      id: '1',
      code: 'SUP-001',
      name: 'Vinamilk',
      phone: '0123456789',
      isActive: true,
    });

    mockSupplierRepo.findById.mockResolvedValue(mockSupplier);

    const delivery1 = new DeliveryHistory({
      id: 101n,
      orderId: 501n,
      poCode: 'PO-20260904-0001',
      supplierId: 1n,
      promisedDate: new Date('2026-09-06T00:00:00.000Z'),
      actualDeliveryDate: new Date('2026-09-06T00:00:00.000Z'),
      leadTimeDays: 2,
      totalOrderedQuantity: 72,
      totalDeliveredQuantity: 72,
      totalDefectiveQuantity: 2,
      totalAcceptedQuantity: 70,
      isOnTime: true,
      isInFull: true,
      isOtif: true,
      notes: 'Hàng đủ số lượng, 2 hộp móp góc vỏ thùng',
      receivedBy: '00000000-0000-0000-0000-000000000001',
      receivedAt: new Date('2026-09-06T14:30:00.000Z'),
    });

    const delivery2 = new DeliveryHistory({
      id: 102n,
      orderId: 502n,
      poCode: 'PO-20260901-0002',
      supplierId: 1n,
      promisedDate: new Date('2026-09-03T00:00:00.000Z'),
      actualDeliveryDate: new Date('2026-09-04T00:00:00.000Z'), // Trễ 1 ngày
      leadTimeDays: 3,
      totalOrderedQuantity: 100,
      totalDeliveredQuantity: 90, // Thiếu 10
      totalDefectiveQuantity: 0,
      totalAcceptedQuantity: 90,
      isOnTime: false,
      isInFull: false,
      isOtif: false,
      notes: 'Giao trễ và thiếu',
      receivedBy: '00000000-0000-0000-0000-000000000001',
      receivedAt: new Date('2026-09-04T10:00:00.000Z'),
    });

    mockDeliveryRepo.findRecentBySupplierId.mockResolvedValue([delivery1, delivery2]);

    const result = await useCase.execute('1', 5);

    expect(result).toHaveLength(2);
    expect(mockDeliveryRepo.findRecentBySupplierId).toHaveBeenCalledWith(1n, 5);

    expect(result[0]).toEqual({
      id: 101,
      poId: 501,
      poCode: 'PO-20260904-0001',
      promisedDeliveryDate: '2026-09-06',
      actualDeliveryDate: '2026-09-06',
      leadTimeDays: 2,
      totalOrderedQuantity: 72,
      totalDeliveredQuantity: 72,
      totalDefectiveQuantity: 2,
      isOtif: true,
      notes: 'Hàng đủ số lượng, 2 hộp móp góc vỏ thùng',
      createdAt: '2026-09-06T14:30:00.000Z',
    });

    expect(result[1]).toEqual({
      id: 102,
      poId: 502,
      poCode: 'PO-20260901-0002',
      promisedDeliveryDate: '2026-09-03',
      actualDeliveryDate: '2026-09-04',
      leadTimeDays: 3,
      totalOrderedQuantity: 100,
      totalDeliveredQuantity: 90,
      totalDefectiveQuantity: 0,
      isOtif: false,
      notes: 'Giao trễ và thiếu',
      createdAt: '2026-09-04T10:00:00.000Z',
    });
  });
});
