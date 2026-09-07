import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { InventoryDashboardDTO } from '../../dtos/InventoryDTO';

export class GetInventoryDashboardUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  public async execute(): Promise<InventoryDashboardDTO> {
    const summary = await this.inventoryRepository.getKpiSummary();

    const safeCount = summary.normal;
    const atRiskCount = summary.outOfStock + summary.critical + summary.warning + summary.overstock;
    const evaluatedTotal = safeCount + atRiskCount;

    const safeRatio = evaluatedTotal > 0 ? Math.round((safeCount / evaluatedTotal) * 1000) / 10 : 100;
    const atRiskRatio = evaluatedTotal > 0 ? Math.round((atRiskCount / evaluatedTotal) * 1000) / 10 : 0;

    return {
      totalSku: summary.totalSku,
      kpiSummary: {
        outOfStock: summary.outOfStock,
        critical: summary.critical,
        warning: summary.warning,
        normal: summary.normal,
        overstock: summary.overstock,
        deadStock: summary.deadStock,
      },
      riskDistributionPct: {
        safeRatio,
        atRiskRatio,
      },
    };
  }
}
