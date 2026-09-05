import { getPrismaClient } from '../database/prisma';
import { Product } from '../../domain/entities/Product';
import { IProductRepository, ProductFilterOptions } from '../../domain/repositories/IProductRepository';

export class PrismaProductRepository implements IProductRepository {
  public async findBySku(sku: string): Promise<Product | null> {
    const prisma = getPrismaClient();
    const record = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAll(options?: ProductFilterOptions): Promise<{ products: Product[]; total: number }> {
    const where: any = {};
    if (options?.category) {
      where.category = options.category;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.search) {
      where.OR = [
        { sku: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const prisma = getPrismaClient();
    const [records, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { sku: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: records.map((r) => this.toDomain(r)),
      total,
    };
  }

  public async findAllCategories(): Promise<string[]> {
    const prisma = getPrismaClient();
    const result = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category);
  }

  public async save(product: Product): Promise<Product> {
    const prisma = getPrismaClient();
    const record = await prisma.product.create({
      data: {
        sku: product.sku.value,
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        defaultLeadTime: product.defaultLeadTime,
        minSafetyStock: product.minSafetyStock,
        isActive: product.isActive,
      },
    });
    return this.toDomain(record);
  }

  public async update(product: Product): Promise<Product> {
    const prisma = getPrismaClient();
    const record = await prisma.product.update({
      where: { sku: product.sku.value },
      data: {
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        defaultLeadTime: product.defaultLeadTime,
        minSafetyStock: product.minSafetyStock,
        isActive: product.isActive,
      },
    });
    return this.toDomain(record);
  }

  public async exists(sku: string): Promise<boolean> {
    const prisma = getPrismaClient();
    const count = await prisma.product.count({
      where: { sku: sku.trim().toUpperCase() },
    });
    return count > 0;
  }

  private toDomain(record: any): Product {
    return new Product({
      sku: record.sku,
      name: record.name,
      category: record.category,
      unit: record.unit,
      costPrice: Number(record.costPrice),
      sellingPrice: Number(record.sellingPrice),
      defaultLeadTime: record.defaultLeadTime,
      minSafetyStock: record.minSafetyStock,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
