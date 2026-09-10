import { CreatePurchaseOrderDto, PurchaseOrderResponseDto, PurchaseOrderItemResponseDto } from '../../dtos/PurchaseOrderDTO';
import { PurchaseOrder, PurchaseOrderItem } from '../../../domain/entities/PurchaseOrder';
import { IPurchaseOrderRepository } from '../../../domain/repositories/IPurchaseOrderRepository';
import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { ApplicationException } from '../../exceptions/ApplicationException';
import { POCode } from '../../../domain/value-objects/POCode';
import { Money } from '../../../domain/value-objects/Money';

export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepo: IPurchaseOrderRepository,
    private readonly supplierRepo: ISupplierRepository,
    private readonly productRepo: IProductRepository,
    private readonly uow: IUnitOfWork
  ) {}

  public async execute(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.uow.executeInTransaction(async () => {
      // 1. Validate Supplier
      const supplier = await this.supplierRepo.findById(dto.supplierId.toString());
      if (!supplier) {
        throw new ApplicationException('Không tìm thấy nhà cung cấp', 'RESOURCE_NOT_FOUND');
      }
      if (!supplier.isActive) {
        throw new ApplicationException('Nhà cung cấp đã ngừng hoạt động', 'VALIDATION_ERROR');
      }

      // 2. Validate Items & Create Domain Objects
      if (!dto.items || dto.items.length === 0) {
        throw new ApplicationException('Đơn mua hàng phải có ít nhất 1 sản phẩm', 'VALIDATION_ERROR');
      }

      const orderItems: PurchaseOrderItem[] = [];
      for (const itemDto of dto.items) {
        const product = await this.productRepo.findBySku(itemDto.productSku);
        if (!product) {
          throw new ApplicationException(`Sản phẩm với SKU ${itemDto.productSku} không tồn tại`, 'RESOURCE_NOT_FOUND');
        }

        const poItem = new PurchaseOrderItem({
          productSku: itemDto.productSku,
          orderedQuantity: itemDto.orderedQuantity,
          unitPrice: new Money(itemDto.unitPrice),
        });
        orderItems.push(poItem);
      }

      // 3. Generate POCode (Sequence per day)
      const today = new Date();
      const countToday = await this.purchaseOrderRepo.countPOsInDate(today);
      const sequence = countToday + 1;
      const poCode = POCode.generate(today, sequence);

      // 4. Create PurchaseOrder Domain Entity
      const purchaseOrder = new PurchaseOrder({
        poCode: poCode,
        supplierId: dto.supplierId,
        promisedDeliveryDate: dto.promisedDeliveryDate,
        notes: dto.notes,
        createdBy: dto.createdBy,
        items: orderItems,
      });

      // 5. Save to database
      await this.purchaseOrderRepo.save(purchaseOrder);

      // Fetch saved entity with assigned autoincrement ID
      const savedOrder = await this.purchaseOrderRepo.findByCode(poCode.toString());

      // 6. Map to DTO
      return this.mapToResponseDto(savedOrder || purchaseOrder);
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
