import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import {
  CreateSupplierRequestDTO,
  UpdateSupplierRequestDTO,
  SupplierResponseDTO,
  SetProductSupplierTermsRequestDTO,
  ProductSupplierTermsResponseDTO,
} from '../../dtos/SupplierDTO';
import { Supplier } from '../../../domain/entities/Supplier';
import { ProductSupplier } from '../../../domain/entities/ProductSupplier';
import { ValidationException } from '../../../domain/exceptions/ValidationException';

export class ManageSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  public async createSupplier(dto: CreateSupplierRequestDTO): Promise<SupplierResponseDTO> {
    if (!dto.code || !dto.name || !dto.phone) {
      throw new ValidationException('Mã, tên và số điện thoại nhà cung cấp không được để trống');
    }

    const trimmedCode = dto.code.trim().toUpperCase();
    const existing = await this.supplierRepository.findByCode(trimmedCode);
    if (existing) {
      throw new ValidationException(`Mã nhà cung cấp "${trimmedCode}" đã tồn tại trên hệ thống`);
    }

    const supplier = new Supplier({
      code: trimmedCode,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      statusTag: dto.statusTag ?? 'NEW_SUPPLIER',
    });

    const saved = await this.supplierRepository.save(supplier);
    return this.toResponseDTO(saved);
  }

  public async updateSupplier(id: string, dto: UpdateSupplierRequestDTO): Promise<SupplierResponseDTO> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new ValidationException(`Không tìm thấy nhà cung cấp với ID: ${id}`);
    }

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

    const updated = await this.supplierRepository.update(supplier);
    return this.toResponseDTO(updated);
  }

  public async getSuppliers(options?: {
    statusTag?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
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
    });

    return {
      suppliers: result.suppliers.map((s) => this.toResponseDTO(s)),
      total: result.total,
    };
  }

  public async getSupplierById(id: string): Promise<SupplierResponseDTO> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new ValidationException(`Không tìm thấy nhà cung cấp với ID: ${id}`);
    }
    return this.toResponseDTO(supplier);
  }

  public async setProductSupplierTerms(
    dto: SetProductSupplierTermsRequestDTO
  ): Promise<ProductSupplierTermsResponseDTO> {
    const supplier = await this.supplierRepository.findById(dto.supplierId);
    if (!supplier) {
      throw new ValidationException(`Không tìm thấy nhà cung cấp ID: ${dto.supplierId}`);
    }

    const existing = await this.supplierRepository.findProductSupplier(dto.productSku, dto.supplierId);

    const terms = new ProductSupplier({
      id: existing?.id,
      productSku: dto.productSku,
      supplierId: dto.supplierId,
      purchasePrice: dto.purchasePrice,
      moq: dto.moq ?? 1,
      packSize: dto.packSize ?? 1,
      committedLeadTime: dto.committedLeadTime ?? 1,
      isPreferred: dto.isPreferred ?? false,
    });

    let saved: ProductSupplier;
    if (existing) {
      saved = await this.supplierRepository.updateProductSupplier(terms);
    } else {
      saved = await this.supplierRepository.saveProductSupplier(terms);
    }

    return {
      id: saved.id || '',
      productSku: saved.productSku,
      supplierId: saved.supplierId,
      purchasePrice: saved.purchasePrice,
      moq: saved.moq,
      packSize: saved.packSize,
      committedLeadTime: saved.committedLeadTime,
      isPreferred: saved.isPreferred,
      supplierName: supplier.name,
      supplierCode: supplier.code,
    };
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
      id: s.id || '',
      code: s.code,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      statusTag: s.statusTag,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
