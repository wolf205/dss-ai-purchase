import { PrismaClient } from '@prisma/client';
import { IDeliveryHistoryRepository } from '../../domain/repositories/IDeliveryHistoryRepository';
import { DeliveryHistory } from '../../domain/entities/DeliveryHistory';
import { prisma, transactionContext } from '../database/prisma';

export class PrismaDeliveryHistoryRepository implements IDeliveryHistoryRepository {
  private getClient(): PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"> {
    return transactionContext.getStore() || prisma;
  }

  public async save(delivery: DeliveryHistory): Promise<void> {
    const data = {
      orderId: delivery.orderId,
      supplierId: delivery.supplierId,
      promisedDate: delivery.promisedDate,
      actualDeliveryDate: delivery.actualDeliveryDate,
      totalOrderedQuantity: delivery.totalOrderedQuantity,
      totalDeliveredQuantity: delivery.totalDeliveredQuantity,
      totalDefectiveQuantity: delivery.totalDefectiveQuantity,
      totalAcceptedQuantity: delivery.totalAcceptedQuantity,
      leadTimeDays: delivery.leadTimeDays,
      isOnTime: delivery.isOnTime,
      isInFull: delivery.isInFull,
      isOtif: delivery.isOtif,
      notes: delivery.notes,
      receivedBy: delivery.receivedBy,
      receivedAt: delivery.receivedAt
    };

    if (delivery.id) {
      await this.getClient().deliveryHistory.update({
        where: { id: delivery.id },
        data
      });
    } else {
      await this.getClient().deliveryHistory.create({ data });
    }
  }

  public async findByOrderId(orderId: bigint): Promise<DeliveryHistory[]> {
    const records = await this.getClient().deliveryHistory.findMany({
      where: { orderId }
    });

    return records.map(record => {
      return new DeliveryHistory({
        id: record.id,
        orderId: record.orderId,
        supplierId: record.supplierId,
        promisedDate: record.promisedDate,
        actualDeliveryDate: record.actualDeliveryDate,
        totalOrderedQuantity: record.totalOrderedQuantity,
        totalDeliveredQuantity: record.totalDeliveredQuantity,
        totalDefectiveQuantity: record.totalDefectiveQuantity,
        totalAcceptedQuantity: record.totalAcceptedQuantity,
        leadTimeDays: record.leadTimeDays,
        isOnTime: record.isOnTime,
        isInFull: record.isInFull,
        isOtif: record.isOtif,
        notes: record.notes,
        receivedBy: record.receivedBy,
        receivedAt: record.receivedAt
      });
    });
  }

  public async findRecentBySupplierId(supplierId: bigint, limit = 10): Promise<DeliveryHistory[]> {
    const records = await this.getClient().deliveryHistory.findMany({
      where: { supplierId },
      include: {
        order: {
          select: { poCode: true },
        },
      },
      orderBy: { actualDeliveryDate: 'desc' },
      take: limit,
    });

    return records.map(record => {
      return new DeliveryHistory({
        id: record.id,
        orderId: record.orderId,
        poCode: (record as any).order?.poCode,
        supplierId: record.supplierId,
        promisedDate: record.promisedDate,
        actualDeliveryDate: record.actualDeliveryDate,
        totalOrderedQuantity: record.totalOrderedQuantity,
        totalDeliveredQuantity: record.totalDeliveredQuantity,
        totalDefectiveQuantity: record.totalDefectiveQuantity,
        totalAcceptedQuantity: record.totalAcceptedQuantity,
        leadTimeDays: record.leadTimeDays,
        isOnTime: record.isOnTime,
        isInFull: record.isInFull,
        isOtif: record.isOtif,
        notes: record.notes,
        receivedBy: record.receivedBy,
        receivedAt: record.receivedAt
      });
    });
  }
}

