import { DeliveryHistory } from '../entities/DeliveryHistory';

export interface IDeliveryHistoryRepository {
  save(delivery: DeliveryHistory): Promise<void>;
  findByOrderId(orderId: bigint): Promise<DeliveryHistory[]>;
}
