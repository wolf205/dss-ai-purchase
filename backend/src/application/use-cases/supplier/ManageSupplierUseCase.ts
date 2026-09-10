import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import {
  CreateSupplierRequestDTO,
  UpdateSupplierRequestDTO,
  SupplierResponseDTO,
  SupplierDetailResponseDTO,
  SetProductSupplierTermsRequestDTO,
  ProductSupplierTermsResponseDTO,
} from '../../dtos/SupplierDTO';
import { Supplier } from '../../../domain/entities/Supplier';
import { ProductSupplier } from '../../../domain/entities/ProductSupplier';
import {
  ValidationException,
  EntityNotFoundException,
  DuplicateResourceException,
} from '../../exceptions';

export class ManageSupplierUseCase {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly auditLogRepository?: IAuditLogRepository,
    private readonly productRepository?: IProductRepository
  ) {}

  public async createSupplier(
    dto: CreateSupplierRequestDTO,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<SupplierResponseDTO> {
    if (!dto.code || !dto.name || !dto.phone) {
      throw new ValidationException('Mã, tên và số điện thoại nhà cung cấp không được để trống');
    }

    const trimmedCode = dto.code.trim().toUpperCase();
    const trimmedName = dto.name.trim();

    const existingCode = await this.supplierRepository.findByCode(trimmedCode);
    if (existingCode) {
      throw new DuplicateResourceException('Mã nhà cung cấp', trimmedCode);
    }

    const existingName = await this.supplierRepository.findByName(trimmedName);
    if (existingName) {
      throw new DuplicateResourceException('Tên nhà cung cấp', trimmedName);
    }

    const supplier = new Supplier({
      code: trimmedCode,
      name: trimmedName,
      phone: dto.phone.trim(),
      email: dto.email ? dto.email.trim() : null,
      address: dto.address ? dto.address.trim() : null,
      statusTag: dto.statusTag ?? 'NEW_SUPPLIER',
    });

    try {
      const saved = await this.supplierRepository.save(supplier);

      if (this.auditLogRepository) {
        await this.auditLogRepository.create({
          userId: operatorUserId,
          action: 'CREATE_SUPPLIER',
          entityName: 'suppliers',
          entityId: saved.code,
          newValues: {
            id: saved.id,
            code: saved.code,
            name: saved.name,
            phone: saved.phone,
            email: saved.email,
            statusTag: saved.statusTag,
          },
          ipAddress,
        });
      }

      return this.toResponseDTO(saved);
    } catch (err: any) {
      if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
        const target = err?.meta?.target ? String(err.meta.target) : '';
        if (target.includes('code')) {
          throw new DuplicateResourceException('Mã nhà cung cấp', trimmedCode);
        }
        throw new DuplicateResourceException('Tên nhà cung cấp', trimmedName);
      }
      throw err;
    }
  }

  public async updateSupplier(
    id: string,
    dto: UpdateSupplierRequestDTO,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<SupplierResponseDTO> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new EntityNotFoundException('nhà cung cấp', id);
    }

    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existingName = await this.supplierRepository.findByName(trimmedName);
      if (existingName && existingName.id !== id) {
        throw new DuplicateResourceException('Tên nhà cung cấp', trimmedName);
      }
    }

    const oldValues = {
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      statusTag: supplier.statusTag,
      isActive: supplier.isActive,
    };
    const oldIsActive = supplier.isActive;

    supplier.updateInfo({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      statusTag: dto.statusTag,
    });

    if (dto.isActive !== undefined) {
      supplier.setActiveStatus(dto.isActive);
    }

    try {
      const updated = await this.supplierRepository.update(supplier);

      if (this.auditLogRepository) {
        let action = 'UPDATE_SUPPLIER';
        if (dto.isActive !== undefined && dto.isActive !== oldIsActive) {
          action = dto.isActive ? 'ACTIVATE_SUPPLIER' : 'DEACTIVATE_SUPPLIER';
        }

        await this.auditLogRepository.create({
          userId: operatorUserId,
          action,
          entityName: 'suppliers',
          entityId: updated.code,
          oldValues,
          newValues: {
            name: updated.name,
            phone: updated.phone,
            email: updated.email,
            address: updated.address,
            statusTag: updated.statusTag,
            isActive: updated.isActive,
          },
          ipAddress,
        });
      }

      return this.toResponseDTO(updated);
    } catch (err: any) {
      if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
        throw new DuplicateResourceException('Tên nhà cung cấp', dto.name?.trim() || '');
      }
      throw err;
    }
  }

  public async getSuppliers(options?: {
    statusTag?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'code' | 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ suppliers: SupplierResponseDTO[]; total: number }> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.max(1, Math.min(100, options?.limit ?? 20));
    const offset = (page - 1) * limit;

    const result = await this.supplierRepository.findAll({
      statusTag: options?.statusTag,
      isActive: options?.isActive,
      search: options?.search,
      limit,
      offset,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    });

    return {
      suppliers: result.suppliers.map((s) => this.toResponseDTO(s)),
      total: result.total,
    };
  }

  public async getSupplierById(id: string): Promise<SupplierDetailResponseDTO> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new EntityNotFoundException('nhà cung cấp', id);
    }

    const termsList = await this.supplierRepository.findProductSuppliersBySupplierId(id);

    return {
      ...this.toResponseDTO(supplier),
      products: (termsList || []).map((t) => ({
        id: t.id || '',
        productSku: t.productSku,
        productName: t.productName,
        supplierId: t.supplierId,
        purchasePrice: t.purchasePrice,
        moq: t.moq,
        packSize: t.packSize,
        committedLeadTime: t.committedLeadTime,
        isPreferred: t.isPreferred,
        supplierName: supplier.name,
        supplierCode: supplier.code,
      })),
    };
  }

  public async setProductSupplierTerms(
    dto: SetProductSupplierTermsRequestDTO,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<ProductSupplierTermsResponseDTO> {
    const supplier = await this.supplierRepository.findById(dto.supplierId);
    if (!supplier) {
      throw new EntityNotFoundException('nhà cung cấp', dto.supplierId);
    }

    const normalizedSku = dto.productSku.trim().toUpperCase();
    let productName: string | undefined;

    if (this.productRepository) {
      const product = await this.productRepository.findBySku(normalizedSku);
      if (!product) {
        throw new EntityNotFoundException('sản phẩm', normalizedSku);
      }
      productName = product.name;
    }

    const existing = await this.supplierRepository.findProductSupplier(normalizedSku, dto.supplierId);

    const terms = new ProductSupplier({
      id: existing?.id,
      productSku: normalizedSku,
      supplierId: dto.supplierId,
      purchasePrice: dto.purchasePrice,
      moq: dto.moq ?? 1,
      packSize: dto.packSize ?? 1,
      committedLeadTime: dto.committedLeadTime ?? 1,
      isPreferred: dto.isPreferred ?? false,
      productName,
    });

    try {
      let saved: ProductSupplier;
      if (existing) {
        saved = await this.supplierRepository.updateProductSupplier(terms);
      } else {
        saved = await this.supplierRepository.saveProductSupplier(terms);
      }

      if (this.auditLogRepository) {
        await this.auditLogRepository.create({
          userId: operatorUserId,
          action: 'SET_PRODUCT_SUPPLIER_TERMS',
          entityName: 'product_suppliers',
          entityId: `${saved.productSku}_${saved.supplierId}`,
          oldValues: existing
            ? {
                purchasePrice: existing.purchasePrice,
                moq: existing.moq,
                packSize: existing.packSize,
                committedLeadTime: existing.committedLeadTime,
                isPreferred: existing.isPreferred,
              }
            : null,
          newValues: {
            purchasePrice: saved.purchasePrice,
            moq: saved.moq,
            packSize: saved.packSize,
            committedLeadTime: saved.committedLeadTime,
            isPreferred: saved.isPreferred,
          },
          ipAddress,
        });
      }

      return {
        id: saved.id || '',
        productSku: saved.productSku,
        productName: productName ?? saved.productName,
        supplierId: saved.supplierId,
        purchasePrice: saved.purchasePrice,
        moq: saved.moq,
        packSize: saved.packSize,
        committedLeadTime: saved.committedLeadTime,
        isPreferred: saved.isPreferred,
        supplierName: supplier.name,
        supplierCode: supplier.code,
      };
    } catch (err: any) {
      if (err?.code === 'P2003' || err?.message?.includes('Foreign key')) {
        throw new EntityNotFoundException('sản phẩm', normalizedSku);
      }
      throw err;
    }
  }

  public async getSuppliersByProductSku(
    productSku: string
  ): Promise<ProductSupplierTermsResponseDTO[]> {
    const records = await this.supplierRepository.findSuppliersByProductSku(productSku);
    return records.map(({ supplier, terms }) => ({
      id: terms.id || '',
      productSku: terms.productSku,
      supplierId: terms.supplierId,
      purchasePrice: terms.purchasePrice,
      moq: terms.moq,
      packSize: terms.packSize,
      committedLeadTime: terms.committedLeadTime,
      isPreferred: terms.isPreferred,
      supplierName: supplier.name,
      supplierCode: supplier.code,
    }));
  }

  private toResponseDTO(s: Supplier): SupplierResponseDTO {
    return {
      id: s.id ? Number(s.id) : 0,
      code: s.code,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      statusTag: s.statusTag,
      isActive: s.isActive,
      productCount: s.productCount,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
