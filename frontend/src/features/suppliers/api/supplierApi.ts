import apiClient from '../../../lib/axios';
import { Supplier, SupplierEvaluation, SupplierWeightConfig } from '../types/supplier.types';

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    code: 'SUP-VINAMILK',
    name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    phone: '02854155555',
    email: 'contact@vinamilk.com.vn',
    statusTag: 'ACTIVE',
    isActive: true,
    productCount: 24,
  },
  {
    id: 2,
    code: 'SUP-TH-TRUE',
    name: 'Công ty Cổ phần Chuỗi Thực Phẩm TH (TH True Milk)',
    phone: '1800545440',
    email: 'chamsockhachhang@thmilk.vn',
    statusTag: 'ACTIVE',
    isActive: true,
    productCount: 16,
  },
  {
    id: 3,
    code: 'SUP-ACECOOK',
    name: 'Công ty Cổ phần Acecook Việt Nam',
    phone: '02838154064',
    email: 'info@acecookvietnam.com',
    statusTag: 'ACTIVE',
    isActive: true,
    productCount: 12,
  },
  {
    id: 4,
    code: 'SUP-HEINEKEN',
    name: 'Công ty TNHH Nhà Máy Bia Heineken Việt Nam',
    phone: '02838222755',
    email: 'contact@heineken.com.vn',
    statusTag: 'ACTIVE',
    isActive: true,
    productCount: 8,
  },
];

const MOCK_EVALUATIONS: SupplierEvaluation[] = [
  {
    supplierId: 1,
    supplierCode: 'SUP-VINAMILK',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    deliveryCountAnalyzed: 18,
    totalScore: 92.5,
    rank: 1,
    isNewSupplier: false,
    scores: {
      priceScore: 95.0,
      otifScore: 90.0,
      qualityScore: 98.5,
      leadTimeScore: 85.0,
    },
  },
  {
    supplierId: 4,
    supplierCode: 'SUP-HEINEKEN',
    supplierName: 'Công ty TNHH Nhà Máy Bia Heineken Việt Nam',
    deliveryCountAnalyzed: 12,
    totalScore: 91.0,
    rank: 2,
    isNewSupplier: false,
    scores: {
      priceScore: 92.0,
      otifScore: 88.0,
      qualityScore: 99.0,
      leadTimeScore: 86.0,
    },
  },
  {
    supplierId: 3,
    supplierCode: 'SUP-ACECOOK',
    supplierName: 'Công ty Cổ phần Acecook Việt Nam',
    deliveryCountAnalyzed: 15,
    totalScore: 89.2,
    rank: 3,
    isNewSupplier: false,
    scores: {
      priceScore: 88.0,
      otifScore: 95.0,
      qualityScore: 94.0,
      leadTimeScore: 92.0,
    },
  },
  {
    supplierId: 2,
    supplierCode: 'SUP-TH-TRUE',
    supplierName: 'Công ty Cổ phần Chuỗi Thực Phẩm TH (TH True Milk)',
    deliveryCountAnalyzed: 10,
    totalScore: 86.4,
    rank: 4,
    isNewSupplier: false,
    scores: {
      priceScore: 85.0,
      otifScore: 84.0,
      qualityScore: 96.0,
      leadTimeScore: 82.0,
    },
  },
];

export const supplierApi = {
  getSuppliers: async (params?: { search?: string }): Promise<Supplier[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Supplier[] }>('/suppliers', { params });
      return res.data.data;
    } catch {
      let list = [...MOCK_SUPPLIERS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
      }
      return list;
    }
  },

  createSupplier: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const res = await apiClient.post<{ success: boolean; data: Supplier }>('/suppliers', payload);
    return res.data.data;
  },

  updateSupplier: async (id: number, payload: Partial<Supplier>): Promise<Supplier> => {
    const res = await apiClient.patch<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, payload);
    return res.data.data;
  },

  getEvaluations: async (): Promise<SupplierEvaluation[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: SupplierEvaluation[] }>('/suppliers/evaluations');
      return res.data.data;
    } catch {
      return MOCK_EVALUATIONS;
    }
  },

  getWeights: async (): Promise<SupplierWeightConfig> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: SupplierWeightConfig }>('/suppliers/weights');
      return res.data.data;
    } catch {
      return {
        weightOtif: 35.0,
        weightQuality: 30.0,
        weightPrice: 20.0,
        weightLeadtime: 15.0,
      };
    }
  },

  updateWeights: async (weights: SupplierWeightConfig): Promise<void> => {
    await apiClient.put('/suppliers/weights', weights);
  },
};

export default supplierApi;
