import { getPrismaClient } from '../database/prisma';
import { Inventory } from '../../domain/entities/Inventory';
import {
  IInventoryRepository,
  InventoryFilterOptions,
  InventoryKpiSummary,
  InventoryItemWithProduct,
} from '../../domain/repositories/IInventoryRepository';
import { RiskLevelEnum } from '../../domain/value-objects/RiskLevel';

export class PrismaInventoryRepository implements IInventoryRepository {
  public async findByProductSku(productSku: string): Promise<Inventory | null> {
    const prisma = getPrismaClient();
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
    if (options?.category) {
      where.product = { category: options.category };
    }
    if (options?.search) {
      where.OR = [
        { productSku: { contains: options.search, mode: 'insensitive' } },
        { product: { name: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const prisma = getPrismaClient();
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

  public async findAllWithProducts(
    options?: InventoryFilterOptions
  ): Promise<{ items: InventoryItemWithProduct[]; total: number }> {
    const where: any = {
      product: { isActive: true },
    };
    if (options?.riskLevel) {
      where.riskLevel = options.riskLevel as any;
    }
    if (options?.isDeadStock !== undefined) {
      where.isDeadStock = options.isDeadStock;
    }
    if (options?.category) {
      where.product = { ...where.product, category: options.category };
    }
    if (options?.search) {
      where.OR = [
        { productSku: { contains: options.search, mode: 'insensitive' } },
        { product: { name: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const prisma = getPrismaClient();
    const [records, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        include: {
          product: true,
        },
        orderBy: { productSku: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    const items: InventoryItemWithProduct[] = records.map((r) => ({
      inventory: this.toDomain(r),
      productName: r.product?.name || r.productSku,
      category: r.product?.category || '',
      unit: r.product?.unit || 'Đơn vị',
      costPrice: Number(r.product?.costPrice || 0),
    }));

    return { items, total };
  }

  public async getKpiSummary(): Promise<InventoryKpiSummary> {
    const prisma = getPrismaClient();

    const [totalSku, outOfStock, critical, warning, normal, overstock, deadStock] = await Promise.all([
      prisma.inventory.count({ where: { product: { isActive: true } } }),
      prisma.inventory.count({ where: { riskLevel: 'OUT_OF_STOCK', product: { isActive: true } } }),
      prisma.inventory.count({ where: { riskLevel: 'CRITICAL', product: { isActive: true } } }),
      prisma.inventory.count({ where: { riskLevel: 'WARNING', product: { isActive: true } } }),
      prisma.inventory.count({ where: { riskLevel: 'NORMAL', product: { isActive: true } } }),
      prisma.inventory.count({ where: { riskLevel: 'OVERSTOCK', product: { isActive: true } } }),
      prisma.inventory.count({ where: { isDeadStock: true, product: { isActive: true } } }),
    ]);

    return {
      totalSku,
      outOfStock,
      critical,
      warning,
      normal,
      overstock,
      deadStock,
    };
  }

  public async save(inventory: Inventory): Promise<Inventory> {
    const prisma = getPrismaClient();
    const record = await prisma.inventory.upsert({
      where: { productSku: inventory.productSku },
      create: {
        productSku: inventory.productSku,
        onHand: inventory.onHand,
        onOrder: inventory.onOrder,
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
    const prisma = getPrismaClient();
    const record = await prisma.inventory.update({
      where: { productSku: inventory.productSku },
      data: {
        onHand: inventory.onHand,
        onOrder: inventory.onOrder,
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

  public async updateOnHand(productSku: string, newOnHand: number, stocktakeDate?: Date): Promise<Inventory> {
    const current = await this.findByProductSku(productSku);
    if (!current) {
      const inv = new Inventory({ productSku, onHand: newOnHand, lastStocktakeDate: stocktakeDate });
      return await this.save(inv);
    }
    current.updateOnHand(newOnHand, stocktakeDate);
    return await this.update(current);
  }

  public async updateOnOrder(productSku: string, delta: number): Promise<Inventory> {
    const prisma = getPrismaClient();
    const record = await prisma.inventory.update({
      where: { productSku: productSku.trim().toUpperCase() },
      data: {
        onOrder: { increment: delta },
      },
    });
    return this.toDomain(record);
  }

  public async batchUpdateDss(
    items: Array<{
      productSku: string;
      safetyStock: number;
      reorderPoint: number;
      maxStock: number;
      daysOfSupply: number;
      riskLevel: string;
      isDeadStock: boolean;
    }>
  ): Promise<void> {
    if (items.length === 0) return;
    const client = getPrismaClient();

    for (const item of items) {
      await client.inventory.update({
        where: { productSku: item.productSku },
        data: {
          safetyStock: item.safetyStock,
          reorderPoint: item.reorderPoint,
          maxStock: item.maxStock,
          daysOfSupply: item.daysOfSupply,
          riskLevel: item.riskLevel as any,
          isDeadStock: item.isDeadStock,
        },
      });
    }
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
