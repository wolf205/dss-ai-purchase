import { IAbcXyzAnalysisRepository } from '../../../domain/repositories/IAbcXyzAnalysisRepository';
import { AbcXyzMatrixDTO } from '../../dtos/InventoryDTO';

export class GetAbcXyzMatrixUseCase {
  constructor(private readonly abcXyzAnalysisRepository: IAbcXyzAnalysisRepository) {}

  public async execute(): Promise<AbcXyzMatrixDTO> {
    const rawMatrix = await this.abcXyzAnalysisRepository.getLatestMatrix();

    const matrix: Record<string, { segment: string; skuCount: number; revenuePct: number }> = {};
    for (const [key, val] of Object.entries(rawMatrix)) {
      matrix[key] = {
        segment: key,
        skuCount: val.skuCount,
        revenuePct: val.revenuePct,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return {
      matrix,
      analysisDate: todayStr,
    };
  }
}
