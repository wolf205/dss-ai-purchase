import { getPrismaClient } from '../database/prisma';
import {
  IRefreshTokenRepository,
  RefreshTokenEntity,
  CreateRefreshTokenData,
} from '../../domain/repositories/IRefreshTokenRepository';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  public async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const prisma = getPrismaClient();
    const record = await prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return this.toEntity(record);
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const prisma = getPrismaClient();
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record) return null;
    return this.toEntity(record);
  }

  public async revoke(tokenHash: string, replacedByTokenHash?: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: {
        revokedAt: new Date(),
        ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
      },
    });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private toEntity(record: any): RefreshTokenEntity {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      replacedByTokenHash: record.replacedByTokenHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      createdAt: record.createdAt,
    };
  }
}
