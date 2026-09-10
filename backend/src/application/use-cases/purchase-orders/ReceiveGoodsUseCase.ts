import { ReceiveGoodsDto, PurchaseOrderResponseDto, PurchaseOrderItemResponseDto } from '../../dtos/PurchaseOrderDTO';
import { PurchaseOrder, PurchaseOrderItem } from '../../../domain/entities/PurchaseOrder';
import { DeliveryHistory } from '../../../domain/entities/DeliveryHistory';
import { IPurchaseOrderRepository } from '../../../domain/repositories/IPurchaseOrderRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { IDeliveryHistoryRepository } from '../../../domain/repositories/IDeliveryHistoryRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { ApplicationException } from '../../exceptions/ApplicationException';
import { DomainException } from '../../../domain/exceptions/DomainException';

export class ReceiveGoodsUseCase {
  constructor(
    private readonly purchaseOrderRepo: IPurchaseOrderRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly deliveryHistoryRepo: IDeliveryHistoryRepository,
    private readonly uow: IUnitOfWork
  ) {}

  public async execute(dto: ReceiveGoodsDto): Promise<PurchaseOrderResponseDto> {
    return this.uow.executeInTransaction(async () => {
      // 1. Fetch PurchaseOrder
      const order = await this.purchaseOrderRepo.findById(dto.poId);
      if (!order) {
        throw new ApplicationException('Không tìm thấy đơn mua hàng', 'RESOURCE_NOT_FOUND');
      }

      // Check single receipt rule
      if (order.status === 'RECEIVED') {
        throw new DomainException('Đơn hàng đã được nhận, không thể nhận hàng nhiều lần', 'BUSINESS_RULE_VIOLATION');
      }

      // 2. Validate and map item delivery data
      const deliveryData = dto.items.map(i => ({
        sku: i.productSku,
        deliveredQty: i.deliveredQuantity,
        defectiveQty: i.defectiveQuantity
      }));

      // Calculate totals for DeliveryHistory
      let totalOrderedQuantity = 0;
      let totalDeliveredQuantity = 0;
      let totalDefectiveQuantity = 0;

      for (const orderItem of order.items) {
        totalOrderedQuantity += orderItem.orderedQuantity;
        const receivedItem = deliveryData.find(d => d.sku === orderItem.productSku.toString());
        if (receivedItem) {
          totalDeliveredQuantity += receivedItem.deliveredQty;
          totalDefectiveQuantity += receivedItem.defectiveQty;
        }
      }

      // 3. Update PurchaseOrder and PurchaseOrderItems states
      // This will set actualDeliveryDate and change PO status to RECEIVED
      order.receiveGoods(dto.actualDeliveryDate, deliveryData);

      // 4. Create DeliveryHistory record
      const deliveryHistory = new DeliveryHistory({
        orderId: dto.poId,
        supplierId: order.supplierId,
        orderDate: order.orderDate,
        promisedDate: order.promisedDeliveryDate,
        actualDeliveryDate: dto.actualDeliveryDate,
        totalOrderedQuantity,
        totalDeliveredQuantity,
        totalDefectiveQuantity,
        notes: dto.notes,
        receivedBy: dto.receivedBy,
        receivedAt: new Date()
      });

      // 5. Update Inventory (On-Order -= orderedQuantity, On-Hand += acceptedQuantity)
      for (const item of order.items) {
        // Rollback On-Order (Atomically subtract what was ordered)
        await this.inventoryRepo.updateOnOrder(item.productSku.toString(), -item.orderedQuantity);
        
        // Increase On-Hand (Atomically add what was accepted)
        if (item.acceptedQuantity > 0) {
          const currentInv = await this.inventoryRepo.findByProductSku(item.productSku.toString());
          const currentOnHand = currentInv ? currentInv.onHand : 0;
          await this.inventoryRepo.updateOnHand(item.productSku.toString(), currentOnHand + item.acceptedQuantity);
        }
      }

      // 6. Save everything (handled by UnitOfWork wrapping)
      await this.purchaseOrderRepo.update(order);
      await this.deliveryHistoryRepo.save(deliveryHistory);

      // 7. Map to DTO
      return this.mapToResponseDto(order);
    });
  }

  private mapToResponseDto(order: PurchaseOrder): PurchaseOrderResponseDto {
    return {
      id: order.id?.toString(),
      poCode: order.poCode.toString(),
      supplierId: order.supplierId.toString(),
      status: order.status,
      orderDate: order.orderDate,
      promisedDeliveryDate: order.promisedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      totalAmount: order.totalAmount.amount,
      notes: order.notes,
      createdBy: order.createdBy,
      confirmedBy: order.confirmedBy,
      confirmedAt: order.confirmedAt,
      cancelledBy: order.cancelledBy,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      items: order.items.map(item => this.mapItemToResponseDto(item))
    };
  }

  private mapItemToResponseDto(item: PurchaseOrderItem): PurchaseOrderItemResponseDto {
    return {
      id: item.id?.toString(),
      productSku: item.productSku.toString(),
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice.amount,
      totalPrice: item.totalPrice.amount,
      deliveredQuantity: item.deliveredQuantity,
      defectiveQuantity: item.defectiveQuantity,
      acceptedQuantity: item.acceptedQuantity
    };
  }
}
