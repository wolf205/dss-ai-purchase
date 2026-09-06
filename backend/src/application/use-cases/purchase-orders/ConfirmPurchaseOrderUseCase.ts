import { ConfirmPurchaseOrderDto, PurchaseOrderResponseDto, PurchaseOrderItemResponseDto } from '../../dtos/PurchaseOrderDTO';
import { PurchaseOrder, PurchaseOrderItem } from '../../../domain/entities/PurchaseOrder';
import { IPurchaseOrderRepository } from '../../../domain/repositories/IPurchaseOrderRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { ApplicationException } from '../../exceptions/ApplicationException';

export class ConfirmPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepo: IPurchaseOrderRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly uow: IUnitOfWork
  ) {}

  public async execute(dto: ConfirmPurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.uow.executeInTransaction(async () => {
      // 1. Fetch PurchaseOrder
      const order = await this.purchaseOrderRepo.findById(dto.poId);
      if (!order) {
        throw new ApplicationException('Không tìm thấy đơn mua hàng', 'RESOURCE_NOT_FOUND');
      }

      // 2. Execute Domain logic (Confirm Order changes status to ORDERED)
      order.confirmOrder(dto.confirmedBy);

      // 3. Update Inventory (On-Order += orderedQuantity)
      for (const item of order.items) {
        // Delta = orderedQuantity
        await this.inventoryRepo.updateOnOrder(item.productSku.toString(), item.orderedQuantity);
      }

      // 4. Save Changes
      await this.purchaseOrderRepo.update(order);

      // 5. Map to DTO
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
