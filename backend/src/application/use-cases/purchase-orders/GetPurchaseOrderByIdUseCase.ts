import { IPurchaseOrderRepository } from '../../../domain/repositories/IPurchaseOrderRepository';
import { EntityNotFoundException } from '../../exceptions/EntityNotFoundException';

export class GetPurchaseOrderByIdUseCase {
  constructor(private readonly purchaseOrderRepository: IPurchaseOrderRepository) {}

  public async execute(id: bigint) {
    const order = await this.purchaseOrderRepository.findById(id);
    
    if (!order) {
      throw new EntityNotFoundException('Đơn mua hàng', id.toString());
    }

    return order;
  }
}
