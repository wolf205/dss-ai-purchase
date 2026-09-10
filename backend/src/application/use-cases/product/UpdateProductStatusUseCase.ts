import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository';
import { UpdateProductStatusResponseDTO } from '../../dtos/ProductDTO';
import { EntityNotFoundException } from '../../exceptions';

export class UpdateProductStatusUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  public async execute(
    sku: string,
    isActive: boolean,
    operatorUserId?: string,
    ipAddress?: string
  ): Promise<UpdateProductStatusResponseDTO> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', sku);
    }

    const previousStatus = product.isActive;

    // Tối ưu Idempotency: nếu trạng thái không thay đổi, trả về kết quả ngay mà không cần update DB
    if (previousStatus === isActive) {
      return {
        sku: product.sku.value,
        isActive: product.isActive,
        message: isActive
          ? 'Sản phẩm đã ở trạng thái đang kinh doanh.'
          : 'Sản phẩm đã ở trạng thái ngừng kinh doanh.',
      };
    }

    product.setActiveStatus(isActive);
    await this.productRepository.update(product);

    // Ghi nhận nhật ký kiểm toán (Audit Trail) phục vụ giám sát chuỗi cung ứng theo BR-021
    if (this.auditLogRepository) {
      await this.auditLogRepository.create({
        userId: operatorUserId,
        action: isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
        entityName: 'products',
        entityId: product.sku.value,
        oldValues: { isActive: previousStatus },
        newValues: { isActive },
        ipAddress,
      });
    }

    return {
      sku: product.sku.value,
      isActive: product.isActive,
      message: isActive
        ? 'Đã kích hoạt lại sản phẩm thành công.'
        : 'Đã vô hiệu hóa sản phẩm. Sản phẩm sẽ bị loại trừ khỏi dự báo AI và khuyến nghị mua hàng.',
    };
  }
}
