import { getPrismaClient } from '../database/prisma';
import {
  IAuditLogRepository,
  CreateAuditLogData,
} from '../../domain/repositories/IAuditLogRepository';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  public async create(data: CreateAuditLogData): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId,
        oldValues: data.oldValues ?? undefined,
        newValues: data.newValues ?? undefined,
        ipAddress: data.ipAddress,
      },
    });
  }
}
