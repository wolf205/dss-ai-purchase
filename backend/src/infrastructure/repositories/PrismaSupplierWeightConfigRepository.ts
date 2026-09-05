import { prisma } from '../database/prisma';
import { SupplierWeightConfig } from '../../domain/entities/SupplierWeightConfig';
import { ISupplierWeightConfigRepository } from '../../domain/repositories/ISupplierWeightConfigRepository';

export class PrismaSupplierWeightConfigRepository implements ISupplierWeightConfigRepository {
  public async getLatest(): Promise<SupplierWeightConfig | null> {
    const record = await prisma.supplierEvaluationWeight.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async save(config: SupplierWeightConfig): Promise<SupplierWeightConfig> {
    const record = await prisma.supplierEvaluationWeight.upsert({
      where: { id: config.id ?? 1 },
      create: {
        id: config.id ?? 1,
        weightPrice: config.weightPrice * 100, // stored as percentage in schema e.g. 20.00
        weightOtif: config.weightOtif * 100,   // e.g. 35.00
        weightQuality: config.weightQuality * 100, // e.g. 30.00
        weightLeadtime: config.weightLeadtime * 100, // e.g. 15.00
        updatedBy: config.updatedBy ?? undefined,
      },
      update: {
        weightPrice: config.weightPrice * 100,
        weightOtif: config.weightOtif * 100,
        weightQuality: config.weightQuality * 100,
        weightLeadtime: config.weightLeadtime * 100,
        updatedBy: config.updatedBy ?? undefined,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: any): SupplierWeightConfig {
    return new SupplierWeightConfig({
      id: record.id,
      weightPrice: Number(record.weightPrice) / 100,
      weightOtif: Number(record.weightOtif) / 100,
      weightQuality: Number(record.weightQuality) / 100,
      weightLeadtime: Number(record.weightLeadtime) / 100,
      updatedBy: record.updatedBy,
      updatedAt: record.updatedAt,
    });
  }
}
