import apiClient from '../../../lib/axios';
import { InventoryDashboardData, InventoryItem, Sku360Data } from '../types/inventory.types';
import { MatrixCellData } from '../../../components/charts/AbcXyzMatrixChart';

// Realistic fallback data for demonstration when DSS API routes are being connected
const MOCK_DASHBOARD: InventoryDashboardData = {
  totalSku: 120,
  kpiSummary: {
    outOfStock: 4,
    critical: 11,
    warning: 22,
    normal: 71,
    overstock: 12,
    deadStock: 5,
  },
  riskDistributionPct: {
    safeRatio: 69.2,
    atRiskRatio: 30.8,
  },
};

const MOCK_ITEMS: InventoryItem[] = [
  {
    sku: 'MILK-VNM-180',
    name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
    category: 'Sữa & Bơ sữa',
    onHand: 12,
    onOrder: 0,
    inventoryPosition: 12,
    safetyStock: 15,
    reorderPoint: 35,
    maxStock: 125,
    daysOfSupply: 2.4,
    riskLevel: 'CRITICAL',
    isDeadStock: false,
    unit: 'Hộp',
    costPrice: 6500,
  },
  {
    sku: 'BEER-TIGER-330',
    name: 'Bia Tiger lon 330ml (Thùng 24 lon)',
    category: 'Đồ uống & Giải khát',
    onHand: 0,
    onOrder: 48,
    inventoryPosition: 48,
    safetyStock: 20,
    reorderPoint: 50,
    maxStock: 150,
    daysOfSupply: 0,
    riskLevel: 'OUT_OF_STOCK',
    isDeadStock: false,
    unit: 'Lon',
    costPrice: 16500,
  },
  {
    sku: 'NOODLE-HAOHAO-75',
    name: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
    category: 'Thực phẩm khô',
    onHand: 28,
    onOrder: 0,
    inventoryPosition: 28,
    safetyStock: 25,
    reorderPoint: 45,
    maxStock: 200,
    daysOfSupply: 4.8,
    riskLevel: 'WARNING',
    isDeadStock: false,
    unit: 'Gói',
    costPrice: 3800,
  },
  {
    sku: 'YOGURT-TH-100',
    name: 'Sữa chua ăn TH True Yogurt 100g',
    category: 'Sữa & Bơ sữa',
    onHand: 65,
    onOrder: 0,
    inventoryPosition: 65,
    safetyStock: 18,
    reorderPoint: 38,
    maxStock: 100,
    daysOfSupply: 14.5,
    riskLevel: 'NORMAL',
    isDeadStock: false,
    unit: 'Hộp',
    costPrice: 7000,
  },
  {
    sku: 'COOKING-OIL-NEPTUNE-1L',
    name: 'Dầu ăn thượng hạng Neptune Gold 1 Lít',
    category: 'Gia vị & Đồ nấu',
    onHand: 110,
    onOrder: 0,
    inventoryPosition: 110,
    safetyStock: 15,
    reorderPoint: 30,
    maxStock: 80,
    daysOfSupply: 42.0,
    riskLevel: 'OVERSTOCK',
    isDeadStock: false,
    unit: 'Chai',
    costPrice: 48000,
  },
  {
    sku: 'TEA-LIPTON-YELLOW-100',
    name: 'Trà túi lọc Lipton nhãn vàng 100 túi',
    category: 'Đồ uống & Giải khát',
    onHand: 25,
    onOrder: 0,
    inventoryPosition: 25,
    safetyStock: 5,
    reorderPoint: 10,
    maxStock: 30,
    daysOfSupply: 95.0,
    riskLevel: 'DEAD_STOCK',
    isDeadStock: true,
    unit: 'Hộp',
    costPrice: 62000,
  },
];

const MOCK_MATRIX: Record<string, MatrixCellData> = {
  AX: { segment: 'AX', skuCount: 18, revenuePct: 54.2 },
  AY: { segment: 'AY', skuCount: 12, revenuePct: 21.0 },
  AZ: { segment: 'AZ', skuCount: 5, revenuePct: 4.8 },
  BX: { segment: 'BX', skuCount: 22, revenuePct: 8.5 },
  BY: { segment: 'BY', skuCount: 15, revenuePct: 4.5 },
  BZ: { segment: 'BZ', skuCount: 8, revenuePct: 2.0 },
  CX: { segment: 'CX', skuCount: 30, revenuePct: 2.5 },
  CY: { segment: 'CY', skuCount: 25, revenuePct: 1.5 },
  CZ: { segment: 'CZ', skuCount: 15, revenuePct: 1.0 },
};

export const inventoryApi = {
  getDashboard: async (): Promise<InventoryDashboardData> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: InventoryDashboardData }>('/inventory/dashboard');
      return res.data.data;
    } catch {
      return MOCK_DASHBOARD;
    }
  },

  getItems: async (params?: { riskLevel?: string; isDeadStock?: boolean; search?: string; limit?: number; page?: number }): Promise<InventoryItem[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/inventory/items', {
        params: { limit: 200, ...params },
      });
      return res.data.data;
    } catch {
      let filtered = [...MOCK_ITEMS];
      if (params?.riskLevel) {
        filtered = filtered.filter((item) => item.riskLevel === params.riskLevel);
      }
      if (params?.isDeadStock !== undefined) {
        filtered = filtered.filter((item) => item.isDeadStock === params.isDeadStock);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getAbcXyzMatrix: async (): Promise<Record<string, MatrixCellData>> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { matrix: Record<string, MatrixCellData> } }>('/inventory/abc-xyz');
      return res.data.data.matrix;
    } catch {
      return MOCK_MATRIX;
    }
  },

  getSku360: async (sku: string): Promise<Sku360Data> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Sku360Data }>(`/products/${sku}/360`);
      return res.data.data;
    } catch {
      const item = MOCK_ITEMS.find((i) => i.sku === sku) || MOCK_ITEMS[0];
      return {
        sku: item.sku,
        name: item.name,
        category: item.category,
        inventory: {
          onHand: item.onHand,
          onOrder: item.onOrder,
          ip: item.inventoryPosition,
          rop: item.reorderPoint,
          ss: item.safetyStock,
          dos: item.daysOfSupply,
          riskLevel: item.riskLevel,
        },
        classification: {
          abcClass: 'A',
          xyzClass: 'X',
          segment: 'AX',
          cv: 0.28,
        },
        suppliers: [
          {
            supplierId: 1,
            name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
            purchasePrice: 6200,
            moq: 24,
            packSize: 12,
            score: 92.5,
            leadTime: 2,
          },
          {
            supplierId: 2,
            name: 'Đại Lý Phân Phối Sữa Miền Nam',
            purchasePrice: 6400,
            moq: 12,
            packSize: 6,
            score: 84.0,
            leadTime: 3,
          },
        ],
        forecastPoints: [
          { date: '2026-08-25', actual: 6 },
          { date: '2026-08-26', actual: 7 },
          { date: '2026-08-27', actual: 5 },
          { date: '2026-08-28', actual: 8 },
          { date: '2026-08-29', actual: 9 },
          { date: '2026-08-30', actual: 6 },
          { date: '2026-08-31', actual: 7 },
          { date: '2026-09-01', actual: 5 },
          { date: '2026-09-02', actual: 6 },
          { date: '2026-09-03', actual: 7 },
          { date: '2026-09-04', actual: 6, forecast: 6, lowerBound: 4, upperBound: 8 },
          { date: '2026-09-05', forecast: 7, lowerBound: 5, upperBound: 9 },
          { date: '2026-09-06', forecast: 6, lowerBound: 4, upperBound: 8 },
          { date: '2026-09-07', forecast: 8, lowerBound: 6, upperBound: 10 },
          { date: '2026-09-08', forecast: 7, lowerBound: 5, upperBound: 9 },
          { date: '2026-09-09', forecast: 6, lowerBound: 4, upperBound: 8 },
          { date: '2026-09-10', forecast: 7, lowerBound: 5, upperBound: 9 },
        ],
      };
    }
  },
};

export default inventoryApi;
