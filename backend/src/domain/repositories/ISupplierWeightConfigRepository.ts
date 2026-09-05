import { SupplierWeightConfig } from '../entities/SupplierWeightConfig';

export interface ISupplierWeightConfigRepository {
  getLatest(): Promise<SupplierWeightConfig | null>;
  save(config: SupplierWeightConfig): Promise<SupplierWeightConfig>;
}
