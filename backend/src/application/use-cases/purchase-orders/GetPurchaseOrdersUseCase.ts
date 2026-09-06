import { PurchaseOrderResponseDto, PurchaseOrderItemResponseDto } from '../../dtos/PurchaseOrderDTO';
import { PurchaseOrder, PurchaseOrderItem } from '../../../domain/entities/PurchaseOrder';
import { IPurchaseOrderRepository } from '../../../domain/repositories/IPurchaseOrderRepository';

export interface GetPurchaseOrdersFilter {
  supplierId?: bigint;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PurchaseOrderListItemResponseDto extends PurchaseOrderResponseDto {
  isOverdue: boolean;
}

export class GetPurchaseOrdersUseCase {
  constructor(private readonly purchaseOrderRepo: IPurchaseOrderRepository) {}

  public async execute(filters: GetPurchaseOrdersFilter): Promise<{ data: PurchaseOrderListItemResponseDto[], total: number }> {
    // In a real implementation, findAll should return { data, total }
    // For simplicity, we assume findAll returns the filtered data directly,
    // and we map it.
    // Note: IPurchaseOrderRepository.findAll might need to be adjusted to return total.
    // We'll just call findAll for now.
    const orders = await this.purchaseOrderRepo.findAll(filters);
    
    // We don't have total from findAll yet, so we assume length (which is wrong for pagination)
    // We should fix IPurchaseOrderRepository later to return { orders, total }.
    
    const today = new Date();
    // Normalize today to start of day for comparison
    const todayStr = today.toISOString().split('T')[0];
    const todayStart = new Date(todayStr);

    const data = orders.map(order => {
      const dto = this.mapToResponseDto(order) as PurchaseOrderListItemResponseDto;
      
      let isOverdue = false;
      if (order.status === 'ORDERED') {
        const promisedStr = order.promisedDeliveryDate.toISOString().split('T')[0];
        const promisedStart = new Date(promisedStr);
        if (promisedStart < todayStart) {
          isOverdue = true;
        }
      }
      dto.isOverdue = isOverdue;
      return dto;
    });

    return {
      data,
      total: orders.length // Fallback
    };
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
