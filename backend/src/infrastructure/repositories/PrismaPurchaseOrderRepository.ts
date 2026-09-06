import { PrismaClient } from '@prisma/client';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrder, PurchaseOrderItem } from '../../domain/entities/PurchaseOrder';
import { prisma, transactionContext } from '../database/prisma';

export class PrismaPurchaseOrderRepository implements IPurchaseOrderRepository {
  private getClient(): PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"> {
    return transactionContext.getStore() || prisma;
  }

  public async findById(id: bigint): Promise<PurchaseOrder | null> {
    const record = await this.getClient().purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async findByCode(poCode: string): Promise<PurchaseOrder | null> {
    const record = await this.getClient().purchaseOrder.findUnique({
      where: { poCode },
      include: { items: true },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async save(order: PurchaseOrder): Promise<void> {
    const data = {
      poCode: order.poCode.toString(),
      supplierId: order.supplierId,
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
      items: {
        create: order.items.map(item => ({
          productSku: item.productSku.toString(),
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice.amount,
          totalPrice: item.totalPrice.amount,
          deliveredQuantity: item.deliveredQuantity,
          defectiveQuantity: item.defectiveQuantity,
          acceptedQuantity: item.acceptedQuantity,
        })),
      },
    };

    if (order.id) {
      await this.getClient().purchaseOrder.update({
        where: { id: order.id },
        data: {
          ...data,
          items: {
            deleteMany: {},
            create: data.items.create
          }
        }
      });
    } else {
      await this.getClient().purchaseOrder.create({ data });
    }
  }

  public async update(order: PurchaseOrder): Promise<void> {
    await this.save(order);
  }

  public async countPOsInDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.getClient().purchaseOrder.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
  }

  public async findAll(filters: any): Promise<PurchaseOrder[]> {
    const where: any = {};
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      where.orderDate = {};
      if (filters.startDate) where.orderDate.gte = filters.startDate;
      if (filters.endDate) where.orderDate.lte = filters.endDate;
    }

    const records = await this.getClient().purchaseOrder.findMany({
      where,
      include: { items: true },
      take: filters.limit,
      skip: filters.offset,
      orderBy: { orderDate: 'desc' }
    });

    return records.map(r => this.mapToDomain(r));
  }

  private mapToDomain(record: any): PurchaseOrder {
    const items = record.items.map((i: any) => new PurchaseOrderItem({
      id: i.id,
      orderId: i.orderId,
      productSku: i.productSku,
      orderedQuantity: i.orderedQuantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      deliveredQuantity: i.deliveredQuantity,
      defectiveQuantity: i.defectiveQuantity,
      acceptedQuantity: i.acceptedQuantity,
      createdAt: i.createdAt
    }));

    return new PurchaseOrder({
      id: record.id,
      poCode: record.poCode,
      supplierId: record.supplierId,
      status: record.status,
      orderDate: record.orderDate,
      promisedDeliveryDate: record.promisedDeliveryDate,
      actualDeliveryDate: record.actualDeliveryDate,
      totalAmount: Number(record.totalAmount),
      notes: record.notes,
      createdBy: record.createdBy,
      confirmedBy: record.confirmedBy,
      confirmedAt: record.confirmedAt,
      cancelledBy: record.cancelledBy,
      cancelledAt: record.cancelledAt,
      cancellationReason: record.cancellationReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: items
    });
  }
}
