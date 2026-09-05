import { ISupplierWeightConfigRepository } from '../../../domain/repositories/ISupplierWeightConfigRepository';
import {
  UpdateSupplierWeightsRequestDTO,
  SupplierWeightsResponseDTO,
} from '../../dtos/SupplierDTO';
import { SupplierWeightConfig } from '../../../domain/entities/SupplierWeightConfig';
import { InvalidWeightDistributionException } from '../../../domain/exceptions/InvalidWeightDistributionException';

export class UpdateSupplierWeightsUseCase {
  constructor(private readonly weightConfigRepository: ISupplierWeightConfigRepository) {}

  public async execute(
    dto: UpdateSupplierWeightsRequestDTO,
    updatedBy: string
  ): Promise<SupplierWeightsResponseDTO> {
    try {
      const config = new SupplierWeightConfig({
        id: 1,
        weightPrice: dto.weightPrice,
        weightOtif: dto.weightOtif,
        weightQuality: dto.weightQuality,
        weightLeadtime: dto.weightLeadTime,
        updatedBy,
        updatedAt: new Date(),
      });

      const saved = await this.weightConfigRepository.save(config);

      return {
        id: saved.id ?? 1,
        weightPrice: saved.weightPrice,
        weightOtif: saved.weightOtif,
        weightQuality: saved.weightQuality,
        weightLeadTime: saved.weightLeadtime,
        updatedBy: saved.updatedBy,
        updatedAt: saved.updatedAt,
      };
    } catch (error: any) {
      if (error instanceof InvalidWeightDistributionException) {
        throw error;
      }
      throw new InvalidWeightDistributionException(error.message);
    }
  }
}
