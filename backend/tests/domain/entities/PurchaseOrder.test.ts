import { PurchaseOrder, PurchaseOrderItem } from '../../../src/domain/entities/PurchaseOrder';
import { Money } from '../../../src/domain/value-objects/Money';
import { POCode } from '../../../src/domain/value-objects/POCode';
import { DomainException } from '../../../src/domain/exceptions/DomainException';

describe('PurchaseOrder Entity', () => {
  const mockPOCode = new POCode('PO-20231010-0001');

  it('should initialize with DRAFT status by default', () => {
    const order = new PurchaseOrder({
      poCode: mockPOCode,
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'user-0',
      items: [
        new PurchaseOrderItem({
          productSku: 'SKU-1',
          orderedQuantity: 10,
          unitPrice: new Money(100),
        })
      ]
    });

    expect(order.status).toBe('DRAFT');
    expect(order.totalAmount.amount).toBe(1000); // 10 * 100
  });

  it('should transition to ORDERED', () => {
    const order = new PurchaseOrder({
      poCode: mockPOCode,
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'user-0',
      items: [
        new PurchaseOrderItem({
          productSku: 'SKU-1',
          orderedQuantity: 10,
          unitPrice: new Money(100),
        })
      ]
    });

    order.confirmOrder('user-1');
    expect(order.status).toBe('ORDERED');
    expect(order.confirmedBy).toBe('user-1');
    expect(order.confirmedAt).toBeInstanceOf(Date);
  });

  it('should not transition to RECEIVED from DRAFT', () => {
    const order = new PurchaseOrder({
      poCode: mockPOCode,
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'user-0',
      items: []
    });

    expect(() => order.receiveGoods(new Date(), [])).toThrow(DomainException);
  });

  it('should transition to CANCELLED from ORDERED', () => {
    const order = new PurchaseOrder({
      poCode: mockPOCode,
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'user-0',
      items: [
        new PurchaseOrderItem({
          productSku: 'SKU-1',
          orderedQuantity: 10,
          unitPrice: new Money(100),
        })
      ]
    });
    
    order.confirmOrder('user-1');
    order.cancelOrder('user-2', 'reason');
    expect(order.status).toBe('CANCELLED');
    expect(order.cancellationReason).toBe('reason');
    expect(order.cancelledBy).toBe('user-2');
    expect(order.cancelledAt).toBeInstanceOf(Date);
  });

  it('should calculate received quantities correctly', () => {
    const item = new PurchaseOrderItem({
      productSku: 'SKU-1',
      orderedQuantity: 10,
      unitPrice: new Money(100)
    });
    const order = new PurchaseOrder({
      poCode: mockPOCode,
      supplierId: BigInt(1),
      promisedDeliveryDate: new Date('2030-10-15'),
      createdBy: 'user-0',
      items: [item]
    });
    
    order.confirmOrder('user-1');
    order.receiveGoods(new Date(), [
      { sku: 'SKU-1', deliveredQty: 10, defectiveQty: 2 }
    ]);

    expect(order.status).toBe('RECEIVED');
    expect(item.deliveredQuantity).toBe(10);
    expect(item.defectiveQuantity).toBe(2);
    expect(item.acceptedQuantity).toBe(8); // 10 - 2
  });
});
