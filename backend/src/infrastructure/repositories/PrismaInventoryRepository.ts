import { prisma } from '../database/prisma';
import { Inventory } from '../../domain/entities/Inventory';
import { IInventoryRepository, InventoryFilterOptions } from '../../domain/repositories/IInventoryRepository';
import { RiskLevelEnum } from '../../domain/value-objects/RiskLevel';

export class PrismaInventoryRepository implements IInventoryRepository {
  public async findByProductSku(productSku: string): Promise<Inventory | null> {
    const record = await prisma.inventory.findUnique({
      where: { productSku: productSku.trim().toUpperCase() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAll(options?: InventoryFilterOptions): Promise<{ inventories: Inventory[]; total: number }> {
    const where: any = {};
    if (options?.riskLevel) {
      where.riskLevel = options.riskLevel as any;
    }
    if (options?.isDeadStock !== undefined) {
      where.isDeadStock = options.isDeadStock;
    }
    if (options?.search) {
      where.OR = [
        { productSku: { contains: options.search, mode: 'insensitive' } },
        { product: { name: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { productSku: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return {
      inventories: records.map((r) => this.toDomain(r)),
      total,
    };
  }

  public async save(inventory: Inventory): Promise<Inventory> {
    const record = await prisma.inventory.upsert({
      where: { productSku: inventory.productSku },
      create: {
        productSku: inventory.productSku,
        onHand: inventory.onHand,
        onOrder: inventory.onOrder,
        calculatedIp: inventory.calculatedIp,
        safetyStock: inventory.safetyStock,
        reorderPoint: inventory.reorderPoint,
        maxStock: inventory.maxStock,
        daysOfSupply: inventory.daysOfSupply,
        riskLevel: inventory.riskLevel.value as any,
        isDeadStock: inventory.isDeadStock,
        lastStocktakeDate: inventory.lastStocktakeDate,
      },
      update: {
        onHand: inventory.onHand,
        onOrder: inventory.onOrder,
        calculatedIp: inventory.calculatedIp,
        safetyStock: inventory.safetyStock,
        reorderPoint: inventory.reorderPoint,
        maxStock: inventory.maxStock,
        daysOfSupply: inventory.daysOfSupply,
        riskLevel: inventory.riskLevel.value as any,
        isDeadStock: inventory.isDeadStock,
        lastStocktakeDate: inventory.lastStocktakeDate,
      },
    });
    return this.toDomain(record);
  }

  public async update(inventory: Inventory): Promise<Inventory> {
    const record = await prisma.inventory.update({
      where: { productSku: inventory.productSku },
      data: {
        onHand: inventory.onHand,
        onOrder: inventory.onOrder,
        calculatedIp: inventory.calculatedIp,
        safetyStock: inventory.safetyStock,
        reorderPoint: inventory.reorderPoint,
        maxStock: inventory.maxStock,
        daysOfSupply: inventory.daysOfSupply,
        riskLevel: inventory.riskLevel.value as any,
        isDeadStock: inventory.isDeadStock,
        lastStocktakeDate: inventory.lastStocktakeDate,
      },
    });
    return this.toDomain(record);
  }

  public async updateOnHand(productSku: string, newOnHand: number): Promise<Inventory> {
    const current = await this.findByProductSku(productSku);
    if (!current) {
      const inv = new Inventory({ productSku, onHand: newOnHand });
      return await this.save(inv);
    }
    current.updateOnHand(newOnHand);
    return await this.update(current);
  }

  public async updateOnOrder(productSku: string, delta: number): Promise<Inventory> {
    const record = await prisma.inventory.update({
      where: { productSku: productSku.trim().toUpperCase() },
      data: {
        onOrder: { increment: delta },
        calculatedIp: { increment: delta },
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: any): Inventory {
    return new Inventory({
      productSku: record.productSku,
      onHand: record.onHand,
      onOrder: record.onOrder,
      calculatedIp: record.calculatedIp,
      safetyStock: record.safetyStock,
      reorderPoint: record.reorderPoint,
      maxStock: record.maxStock,
      daysOfSupply: Number(record.daysOfSupply),
      riskLevel: record.riskLevel as RiskLevelEnum,
      isDeadStock: record.isDeadStock,
      lastStocktakeDate: record.lastStocktakeDate,
      updatedAt: record.updatedAt,
    });
  }
}
