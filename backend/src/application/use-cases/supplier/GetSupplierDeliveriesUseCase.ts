import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IDeliveryHistoryRepository } from '../../../domain/repositories/IDeliveryHistoryRepository';
import { SupplierDeliveryResponseDTO } from '../../dtos/SupplierDTO';
import { EntityNotFoundException } from '../../exceptions';

export class GetSupplierDeliveriesUseCase {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly deliveryHistoryRepository: IDeliveryHistoryRepository
  ) {}

  public async execute(supplierId: string, limit = 10): Promise<SupplierDeliveryResponseDTO[]> {
    // 1. Kiểm tra nhà cung cấp có tồn tại hay không (UC-009, FR-020)
    const supplier = await this.supplierRepository.findById(supplierId);
    if (!supplier) {
      throw new EntityNotFoundException('Nhà cung cấp', supplierId);
    }

    // 2. Lấy danh sách lần giao hàng gần nhất
    const supplierIdBigInt = BigInt(supplierId);
    const deliveries = await this.deliveryHistoryRepository.findRecentBySupplierId(supplierIdBigInt, limit);

    // 3. Ánh xạ dữ liệu sang SupplierDeliveryResponseDTO (endpoints-spec.md Section 3.4)
    return deliveries.map((d) => ({
      id: Number(d.id ?? 0),
      poId: Number(d.orderId),
      poCode: d.poCode || `PO-${d.orderId}`,
      promisedDeliveryDate: d.promisedDate.toISOString().split('T')[0],
      actualDeliveryDate: d.actualDeliveryDate.toISOString().split('T')[0],
      leadTimeDays: d.leadTimeDays,
      totalOrderedQuantity: d.totalOrderedQuantity,
      totalDeliveredQuantity: d.totalDeliveredQuantity,
      totalDefectiveQuantity: d.totalDefectiveQuantity,
      isOtif: d.isOtif,
      notes: d.notes ?? null,
      createdAt: d.receivedAt ? d.receivedAt.toISOString() : new Date().toISOString(),
    }));
  }
}
