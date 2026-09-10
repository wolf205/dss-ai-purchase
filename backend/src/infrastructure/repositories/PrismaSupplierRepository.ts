import { getPrismaClient } from '../database/prisma';
import { Supplier, SupplierStatusTag } from '../../domain/entities/Supplier';
import { ProductSupplier } from '../../domain/entities/ProductSupplier';
import { ISupplierRepository, SupplierFilterOptions } from '../../domain/repositories/ISupplierRepository';

export class PrismaSupplierRepository implements ISupplierRepository {
  public async findById(id: string): Promise<Supplier | null> {
    let bigIntId: bigint;
    try {
      bigIntId = BigInt(id);
    } catch {
      return null;
    }
    const prisma = getPrismaClient();
    const record = await prisma.supplier.findUnique({
      where: { id: bigIntId },
      include: {
        _count: {
          select: { productSuppliers: true },
        },
      },
    });
    if (!record) return null;
    return this.toDomainSupplier(record, (record as any)._count?.productSuppliers);
  }

  public async findByCode(code: string): Promise<Supplier | null> {
    const prisma = getPrismaClient();
    const record = await prisma.supplier.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        _count: {
          select: { productSuppliers: true },
        },
      },
    });
    if (!record) return null;
    return this.toDomainSupplier(record, (record as any)._count?.productSuppliers);
  }

  public async findByName(name: string): Promise<Supplier | null> {
    const prisma = getPrismaClient();
    const record = await prisma.supplier.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
      include: {
        _count: {
          select: { productSuppliers: true },
        },
      },
    });
    if (!record) return null;
    return this.toDomainSupplier(record, (record as any)._count?.productSuppliers);
  }

  public async findAll(options?: SupplierFilterOptions): Promise<{ suppliers: Supplier[]; total: number }> {
    const where: any = {};
    if (options?.statusTag) {
      where.statusTag = options.statusTag as any;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const prisma = getPrismaClient();
    const sortField = options?.sortBy || 'code';
    const sortDirection = options?.sortOrder || 'asc';

    const [records, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { [sortField]: sortDirection },
        include: {
          _count: {
            select: { productSuppliers: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers: records.map((r: any) => this.toDomainSupplier(r, r._count?.productSuppliers)),
      total,
    };
  }

  public async save(supplier: Supplier): Promise<Supplier> {
    const prisma = getPrismaClient();
    const record = await prisma.supplier.create({
      data: {
        code: supplier.code,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        statusTag: supplier.statusTag as any,
        isActive: supplier.isActive,
      },
    });
    return this.toDomainSupplier(record);
  }

  public async update(supplier: Supplier): Promise<Supplier> {
    if (!supplier.id) throw new Error('Supplier ID is required for update');
    const prisma = getPrismaClient();
    const record = await prisma.supplier.update({
      where: { id: BigInt(supplier.id) },
      data: {
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        statusTag: supplier.statusTag as any,
        isActive: supplier.isActive,
      },
      include: {
        _count: {
          select: { productSuppliers: true },
        },
      },
    });
    return this.toDomainSupplier(record, (record as any)._count?.productSuppliers);
  }

  public async findProductSupplier(productSku: string, supplierId: string): Promise<ProductSupplier | null> {
    const prisma = getPrismaClient();
    const record = await prisma.productSupplier.findUnique({
      where: {
        productSku_supplierId: {
          productSku: productSku.trim().toUpperCase(),
          supplierId: BigInt(supplierId),
        },
      },
    });
    if (!record) return null;
    return this.toDomainProductSupplier(record);
  }

  public async findSuppliersByProductSku(
    productSku: string
  ): Promise<{ supplier: Supplier; terms: ProductSupplier }[]> {
    const prisma = getPrismaClient();
    const records = await prisma.productSupplier.findMany({
      where: { productSku: productSku.trim().toUpperCase() },
      include: { supplier: true },
      orderBy: [{ isPreferred: 'desc' }, { purchasePrice: 'asc' }],
    });

    return records.map((r) => ({
      supplier: this.toDomainSupplier(r.supplier),
      terms: this.toDomainProductSupplier(r),
    }));
  }

  public async findAllProductSuppliers(): Promise<ProductSupplier[]> {
    const prisma = getPrismaClient();
    const records = await prisma.productSupplier.findMany();
    return records.map((r) => this.toDomainProductSupplier(r));
  }

  public async findProductSuppliersBySupplierId(supplierId: string): Promise<ProductSupplier[]> {
    let bigIntId: bigint;
    try {
      bigIntId = BigInt(supplierId);
    } catch {
      return [];
    }
    const prisma = getPrismaClient();
    const records = await prisma.productSupplier.findMany({
      where: { supplierId: bigIntId },
      include: { product: true },
      orderBy: [{ isPreferred: 'desc' }, { productSku: 'asc' }],
    });
    return records.map((r) => this.toDomainProductSupplier(r, (r as any).product?.name));
  }

  public async saveProductSupplier(terms: ProductSupplier): Promise<ProductSupplier> {
    const prisma = getPrismaClient();
    const record = await prisma.productSupplier.create({
      data: {
        productSku: terms.productSku,
        supplierId: BigInt(terms.supplierId),
        purchasePrice: terms.purchasePrice,
        moq: terms.moq,
        packSize: terms.packSize,
        committedLeadTime: terms.committedLeadTime,
        isPreferred: terms.isPreferred,
      },
    });
    return this.toDomainProductSupplier(record);
  }

  public async updateProductSupplier(terms: ProductSupplier): Promise<ProductSupplier> {
    const prisma = getPrismaClient();
    const record = await prisma.productSupplier.update({
      where: {
        productSku_supplierId: {
          productSku: terms.productSku,
          supplierId: BigInt(terms.supplierId),
        },
      },
      data: {
        purchasePrice: terms.purchasePrice,
        moq: terms.moq,
        packSize: terms.packSize,
        committedLeadTime: terms.committedLeadTime,
        isPreferred: terms.isPreferred,
      },
    });
    return this.toDomainProductSupplier(record);
  }

  public async deleteProductSupplier(productSku: string, supplierId: string): Promise<boolean> {
    try {
      const prisma = getPrismaClient();
      await prisma.productSupplier.delete({
        where: {
          productSku_supplierId: {
            productSku: productSku.trim().toUpperCase(),
            supplierId: BigInt(supplierId),
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  private toDomainSupplier(record: any, productCount?: number): Supplier {
    return new Supplier({
      id: record.id.toString(),
      code: record.code,
      name: record.name,
      phone: record.phone,
      email: record.email,
      address: record.address,
      statusTag: record.statusTag as SupplierStatusTag,
      isActive: record.isActive,
      productCount: record._count?.productSuppliers ?? productCount ?? 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private toDomainProductSupplier(record: any, productName?: string): ProductSupplier {
    return new ProductSupplier({
      id: record.id.toString(),
      productSku: record.productSku,
      supplierId: record.supplierId.toString(),
      purchasePrice: Number(record.purchasePrice),
      moq: record.moq,
      packSize: record.packSize,
      committedLeadTime: record.committedLeadTime,
      isPreferred: record.isPreferred,
      productName: productName ?? record.product?.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
