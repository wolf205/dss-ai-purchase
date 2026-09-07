import {
  IPurchaseRecommendationRepository,
  RecommendationFilterOptions,
} from '../../../domain/repositories/IPurchaseRecommendationRepository';
import { PurchaseRecommendationItemDTO } from '../../dtos/RecommendationDTO';

export class GetPurchaseRecommendationsUseCase {
  constructor(private readonly recommendationRepository: IPurchaseRecommendationRepository) {}

  public async execute(options?: RecommendationFilterOptions): Promise<PurchaseRecommendationItemDTO[]> {
    const records = await this.recommendationRepository.findAllPending(options);
    return records;
  }
}
