import { ISupplierWeightConfigRepository } from '../../../domain/repositories/ISupplierWeightConfigRepository';
import { SupplierWeightsResponseDTO } from '../../dtos/SupplierDTO';

export class GetSupplierWeightsUseCase {
  constructor(private readonly weightConfigRepository: ISupplierWeightConfigRepository) {}

  public async execute(): Promise<SupplierWeightsResponseDTO> {
    const config = await this.weightConfigRepository.getLatest();
    if (!config) {
      // Default initial weights: Price 20%, OTIF 35%, Quality 30%, LeadTime 15%
      return {
        id: 1,
        weightPrice: 0.20,
        weightOtif: 0.35,
        weightQuality: 0.30,
        weightLeadTime: 0.15,
        updatedBy: null,
        updatedAt: new Date(),
      };
    }

    return {
      id: config.id ?? 1,
      weightPrice: config.weightPrice,
      weightOtif: config.weightOtif,
      weightQuality: config.weightQuality,
      weightLeadTime: config.weightLeadtime,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
    };
  }
}
