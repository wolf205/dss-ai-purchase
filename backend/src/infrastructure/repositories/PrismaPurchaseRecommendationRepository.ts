import { getPrismaClient } from '../database/prisma';
import {
  IPurchaseRecommendationRepository,
  PurchaseRecommendationRecord,
  RecommendationFilterOptions,
} from '../../domain/repositories/IPurchaseRecommendationRepository';

export class PrismaPurchaseRecommendationRepository implements IPurchaseRecommendationRepository {
  public async clearPending(): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.purchaseRecommendation.deleteMany({
      where: { status: 'PENDING' },
    });
  }

  public async saveBatch(recommendations: PurchaseRecommendationRecord[]): Promise<void> {
    if (recommendations.length === 0) return;
    const prisma = getPrismaClient();

    const data = recommendations.map((r) => ({
      productSku: r.productSku,
      recommendedSupplierId: r.recommendedSupplierId,
      horizonDays: r.horizonDays,
      onHandAtEval: r.onHandAtEval,
      onOrderAtEval: r.onOrderAtEval,
      forecastedDemand: r.forecastedDemand,
      safetyStock: r.safetyStock,
      rawShortage: r.rawShortage,
      suggestedQuantity: r.suggestedQuantity,
      suggestedOrderDate: r.suggestedOrderDate,
      estimatedUnitPrice: r.estimatedUnitPrice ?? null,
      estimatedTotalCost: r.estimatedTotalCost ?? null,
      urgencyLevel: r.urgencyLevel as any,
      explanationSummary: r.explanationSummary,
      explanationFactors: r.explanationFactors,
      status: (r.status as any) || 'PENDING',
    }));

    await prisma.purchaseRecommendation.createMany({
      data,
    });
  }

  public async findAllPending(options?: RecommendationFilterOptions): Promise<any[]> {
    const prisma = getPrismaClient() as any;
    const where: any = {
      status: 'PENDING',
      product: { isActive: true },
    };

    if (options?.horizonDays) {
      where.horizonDays = options.horizonDays;
    }
    if (options?.urgencyLevel) {
      where.urgencyLevel = options.urgencyLevel as any;
    }
    if (options?.category) {
      where.product = { ...where.product, category: options.category };
    }

    const records = await prisma.purchaseRecommendation.findMany({
      where,
      include: {
        product: true,
        recommendedSupplier: {
          include: {
            deliveryHistories: {
              take: 10,
              orderBy: { actualDeliveryDate: 'desc' },
            },
            productSuppliers: true,
          },
        },
      },
      orderBy: [
        { urgencyLevel: 'asc' }, // OUT_OF_STOCK, CRITICAL, WARNING
        { suggestedQuantity: 'desc' },
      ],
    });

    return records.map((r: any) => ({
      id: Number(r.id),
      sku: r.productSku,
      productName: r.product?.name || r.productSku,
      category: r.product?.category || '',
      onHand: r.onHandAtEval,
      onOrder: r.onOrderAtEval,
      inventoryPosition: r.onHandAtEval + r.onOrderAtEval,
      reorderPoint: r.safetyStock,
      daysOfSupply: 0,
      urgencyLevel: r.urgencyLevel,
      suggestedQuantity: r.suggestedQuantity,
      suggestedOrderDate: r.suggestedOrderDate instanceof Date ? r.suggestedOrderDate.toISOString().split('T')[0] : String(r.suggestedOrderDate),
      recommendedSupplier: r.recommendedSupplier
        ? {
            supplierId: Number(r.recommendedSupplier.id),
            name: r.recommendedSupplier.name,
            unitPrice: Number(r.estimatedUnitPrice || 0),
            moq: r.recommendedSupplier.productSuppliers?.find((ps: any) => ps.productSku === r.productSku)?.moq || 1,
            packSize:
              r.recommendedSupplier.productSuppliers?.find((ps: any) => ps.productSku === r.productSku)?.packSize || 1,
            score: 90,
            otif: 90,
            leadTime:
              r.recommendedSupplier.productSuppliers?.find((ps: any) => ps.productSku === r.productSku)
                ?.committedLeadTime || 2,
          }
        : null,
      estimatedTotalCost: Number(r.estimatedTotalCost || 0),
      explanationSummary: r.explanationSummary,
      explanationFactors: r.explanationFactors,
    }));
  }
}
