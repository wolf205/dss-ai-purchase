import { prisma } from '../database/prisma';
import { Supplier, SupplierStatusTag } from '../../domain/entities/Supplier';
import { ProductSupplier } from '../../domain/entities/ProductSupplier';
import { ISupplierRepository, SupplierFilterOptions } from '../../domain/repositories/ISupplierRepository';

export class PrismaSupplierRepository implements ISupplierRepository {
  public async findById(id: string): Promise<Supplier | null> {
    const record = await prisma.supplier.findUnique({
      where: { id: BigInt(id) },
    });
    if (!record) return null;
    return this.toDomainSupplier(record);
  }

  public async findByCode(code: string): Promise<Supplier | null> {
    const record = await prisma.supplier.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!record) return null;
    return this.toDomainSupplier(record);
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

    const [records, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { code: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers: records.map((r) => this.toDomainSupplier(r)),
      total,
    };
  }

  public async save(supplier: Supplier): Promise<Supplier> {
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
    });
    return this.toDomainSupplier(record);
  }

  public async findProductSupplier(productSku: string, supplierId: string): Promise<ProductSupplier | null> {
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

  public async saveProductSupplier(terms: ProductSupplier): Promise<ProductSupplier> {
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

  private toDomainSupplier(record: any): Supplier {
    return new Supplier({
      id: record.id.toString(),
      code: record.code,
      name: record.name,
      phone: record.phone,
      email: record.email,
      address: record.address,
      statusTag: record.statusTag as SupplierStatusTag,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private toDomainProductSupplier(record: any): ProductSupplier {
    return new ProductSupplier({
      id: record.id.toString(),
      productSku: record.productSku,
      supplierId: record.supplierId.toString(),
      purchasePrice: Number(record.purchasePrice),
      moq: record.moq,
      packSize: record.packSize,
      committedLeadTime: record.committedLeadTime,
      isPreferred: record.isPreferred,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
