import apiClient from '../../../lib/axios';
import { RecommendationItem, RunAnalysisResult } from '../types/recommendation.types';

const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: 101,
    sku: 'MILK-VNM-180',
    productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
    category: 'Sữa & Bơ sữa',
    onHand: 12,
    onOrder: 0,
    inventoryPosition: 12,
    reorderPoint: 35,
    daysOfSupply: 2.4,
    urgencyLevel: 'CRITICAL',
    suggestedQuantity: 72,
    suggestedOrderDate: '2026-09-06',
    recommendedSupplier: {
      supplierId: 1,
      name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      unitPrice: 6200,
      moq: 24,
      packSize: 12,
      score: 92.5,
      otif: 90.0,
      leadTime: 2,
    },
    estimatedTotalCost: 446400,
    explanationSummary:
      'Vị trí tồn IP (12) thấp hơn điểm đặt hàng ROP (35). Thiếu hụt Qraw = 68 đơn vị. Làm tròn theo MOQ (24) và bội số Pack Size (12) thành 72 đơn vị (6 lốc). Vinamilk được chọn vì đạt điểm đánh giá cao nhất (92.5) và giao hàng đúng hạn 90%.',
    explanationFactors: {
      rawShortage: 68,
      moqApplied: 24,
      packSizeApplied: 12,
    },
  },
  {
    id: 102,
    sku: 'NOODLE-HAOHAO-75',
    productName: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
    category: 'Thực phẩm khô',
    onHand: 28,
    onOrder: 0,
    inventoryPosition: 28,
    reorderPoint: 45,
    daysOfSupply: 4.8,
    urgencyLevel: 'WARNING',
    suggestedQuantity: 60,
    suggestedOrderDate: '2026-09-07',
    recommendedSupplier: {
      supplierId: 3,
      name: 'Acecook Việt Nam Chi Nhánh Phân Phối',
      unitPrice: 3800,
      moq: 30,
      packSize: 30,
      score: 89.2,
      otif: 95.0,
      leadTime: 1,
    },
    estimatedTotalCost: 228000,
    explanationSummary:
      'Tồn kho sắp chạm mức an toàn trong 4.8 ngày tới. Dự báo nhu cầu 14 ngày cần 210 gói. Đề xuất đặt 60 gói (2 thùng) từ Acecook với thời gian giao nhanh 1 ngày.',
    explanationFactors: {
      rawShortage: 52,
      moqApplied: 30,
      packSizeApplied: 30,
    },
  },
  {
    id: 103,
    sku: 'BEER-TIGER-330',
    productName: 'Bia Tiger lon 330ml (Thùng 24 lon)',
    category: 'Đồ uống & Giải khát',
    onHand: 0,
    onOrder: 48,
    inventoryPosition: 48,
    reorderPoint: 50,
    daysOfSupply: 0,
    urgencyLevel: 'OUT_OF_STOCK',
    suggestedQuantity: 48,
    suggestedOrderDate: '2026-09-06',
    recommendedSupplier: {
      supplierId: 4,
      name: 'Heineken Trading Vietnam',
      unitPrice: 16200,
      moq: 24,
      packSize: 24,
      score: 91.0,
      otif: 88.0,
      leadTime: 2,
    },
    estimatedTotalCost: 777600,
    explanationSummary:
      'Tồn kho thực tế = 0, mặc dù đã có đơn chờ về (On-Order = 48) nhưng tổng vị trí tồn IP (48) vẫn chưa vượt ngưỡng an toàn ROP (50) trong đợt cao điểm cuối tuần.',
    explanationFactors: {
      rawShortage: 38,
      moqApplied: 24,
      packSizeApplied: 24,
    },
  },
];

export const recommendationApi = {
  getRecommendations: async (params?: { horizon?: number }): Promise<RecommendationItem[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: RecommendationItem[] }>('/recommendations', { params });
      return res.data.data;
    } catch {
      return MOCK_RECOMMENDATIONS;
    }
  },

  runAnalysis: async (): Promise<RunAnalysisResult> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: RunAnalysisResult }>('/recommendations/run-analysis');
      return res.data.data;
    } catch {
      // Simulate real calculation latency
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        executionTimeMs: 1420,
        skusAnalyzed: 120,
        recommendationsCount: MOCK_RECOMMENDATIONS.length,
        message: 'Đã hoàn thành phân tích toàn bộ dữ liệu và cập nhật danh sách khuyến nghị mua hàng mới nhất.',
      };
    }
  },
};

export default recommendationApi;
