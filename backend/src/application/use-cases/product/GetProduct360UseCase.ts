import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { ISupplierRepository } from '../../../domain/repositories/ISupplierRepository';
import { IAbcXyzAnalysisRepository } from '../../../domain/repositories/IAbcXyzAnalysisRepository';
import { IDemandForecastRepository } from '../../../domain/repositories/IDemandForecastRepository';
import { ISalesHistoryRepository } from '../../../domain/repositories/ISalesHistoryRepository';
import { EntityNotFoundException } from '../../exceptions';
import { Product360DTO } from '../../dtos/InventoryDTO';

export class GetProduct360UseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly supplierRepository: ISupplierRepository,
    private readonly abcXyzAnalysisRepository: IAbcXyzAnalysisRepository,
    private readonly demandForecastRepository: IDemandForecastRepository,
    private readonly salesHistoryRepository: ISalesHistoryRepository
  ) {}

  public async execute(sku: string): Promise<Product360DTO> {
    const cleanSku = sku.trim().toUpperCase();

    const product = await this.productRepository.findBySku(cleanSku);
    if (!product) {
      throw new EntityNotFoundException('sản phẩm', cleanSku);
    }

    const [inventory, abcXyz, productSuppliers, forecast, salesHistory] = await Promise.all([
      this.inventoryRepository.findByProductSku(cleanSku),
      this.abcXyzAnalysisRepository.findLatestBySku(cleanSku),
      this.supplierRepository.findSuppliersByProductSku(cleanSku),
      this.demandForecastRepository.findLatestBySku(cleanSku, 14),
      this.salesHistoryRepository.getDailyAggregates(cleanSku, 14),
    ]);

    // Build supplier list with terms
    const suppliers = productSuppliers.map((item) => ({
      supplierId: Number(item.supplier.id),
      name: item.supplier.name,
      purchasePrice: item.terms.purchasePrice,
      moq: item.terms.moq,
      packSize: item.terms.packSize,
      score: 90.0, // Default baseline or calculated
      leadTime: item.terms.committedLeadTime,
      isPreferred: item.terms.isPreferred,
    }));

    // Build unified forecast points timeline (past 14 actual + future forecasted)
    const forecastPoints: Array<{
      date: string;
      actual?: number;
      forecast?: number;
      lowerBound?: number;
      upperBound?: number;
    }> = [];

    if (salesHistory && salesHistory.length > 0) {
      for (const item of salesHistory) {
        forecastPoints.push({
          date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
          actual: item.quantity,
        });
      }
    }

    if (forecast && forecast.forecastPoints && Array.isArray(forecast.forecastPoints)) {
      for (const fp of forecast.forecastPoints) {
        forecastPoints.push({
          date: fp.date,
          forecast: fp.predicted,
          lowerBound: fp.lowerBound,
          upperBound: fp.upperBound,
        });
      }
    }

    return {
      sku: product.sku.value,
      name: product.name,
      category: product.category,
      inventory: {
        onHand: inventory?.onHand ?? 0,
        onOrder: inventory?.onOrder ?? 0,
        ip: inventory?.calculatedIp ?? 0,
        rop: inventory?.reorderPoint ?? 0,
        ss: inventory?.safetyStock ?? 0,
        dos: inventory?.daysOfSupply ?? 0,
        riskLevel: inventory?.riskLevel.value ?? 'NORMAL',
      },
      classification: {
        abcClass: abcXyz?.abcClass ?? 'A',
        xyzClass: abcXyz?.xyzClass ?? 'X',
        segment: abcXyz?.abcXyzSegment ?? 'AX',
        cv: abcXyz?.coefficientOfVariation ?? 0.25,
      },
      suppliers,
      forecastPoints,
    };
  }
}
