import apiClient from '../../../lib/axios';
import { Product, CreateProductPayload, UpdateProductPayload } from '../types/product.types';

const MOCK_PRODUCTS: Product[] = [
  {
    sku: 'MILK-VNM-180',
    name: 'Sữa tươi tiệt trùng Vinamilk 180ml',
    category: 'Sữa & Bơ sữa',
    unit: 'Hộp',
    costPrice: 6500,
    sellingPrice: 8500,
    defaultLeadTime: 2,
    minSafetyStock: 10,
    isActive: true,
  },
  {
    sku: 'BEER-TIGER-330',
    name: 'Bia Tiger lon 330ml (Thùng 24 lon)',
    category: 'Đồ uống & Giải khát',
    unit: 'Lon',
    costPrice: 16500,
    sellingPrice: 20000,
    defaultLeadTime: 2,
    minSafetyStock: 20,
    isActive: true,
  },
  {
    sku: 'NOODLE-HAOHAO-75',
    name: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
    category: 'Thực phẩm khô',
    unit: 'Gói',
    costPrice: 3800,
    sellingPrice: 5000,
    defaultLeadTime: 1,
    minSafetyStock: 25,
    isActive: true,
  },
  {
    sku: 'YOGURT-TH-100',
    name: 'Sữa chua ăn TH True Yogurt 100g',
    category: 'Sữa & Bơ sữa',
    unit: 'Hộp',
    costPrice: 7000,
    sellingPrice: 9500,
    defaultLeadTime: 2,
    minSafetyStock: 12,
    isActive: true,
  },
  {
    sku: 'COOKING-OIL-NEPTUNE-1L',
    name: 'Dầu ăn thượng hạng Neptune Gold 1 Lít',
    category: 'Gia vị & Đồ nấu',
    unit: 'Chai',
    costPrice: 48000,
    sellingPrice: 58000,
    defaultLeadTime: 3,
    minSafetyStock: 15,
    isActive: true,
  },
  {
    sku: 'TEA-LIPTON-YELLOW-100',
    name: 'Trà túi lọc Lipton nhãn vàng 100 túi',
    category: 'Đồ uống & Giải khát',
    unit: 'Hộp',
    costPrice: 62000,
    sellingPrice: 78000,
    defaultLeadTime: 4,
    minSafetyStock: 5,
    isActive: false, // Inactive product
  },
];

export const productApi = {
  getProducts: async (params?: { search?: string; category?: string; isActive?: boolean }): Promise<Product[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Product[] }>('/products', { params });
      return res.data.data;
    } catch {
      let filtered = [...MOCK_PRODUCTS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      if (params?.category) {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params?.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === params.isActive);
      }
      return filtered;
    }
  },

  getCategories: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: string[] }>('/products/categories');
      return res.data.data;
    } catch {
      return ['Sữa & Bơ sữa', 'Đồ uống & Giải khát', 'Thực phẩm khô', 'Gia vị & Đồ nấu', 'Bánh kẹo & Ăn vặt'];
    }
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await apiClient.post<{ success: boolean; data: Product }>('/products', payload);
    return res.data.data;
  },

  updateProduct: async (sku: string, payload: UpdateProductPayload): Promise<Product> => {
    const res = await apiClient.patch<{ success: boolean; data: Product }>(`/products/${sku}`, payload);
    return res.data.data;
  },
};

export default productApi;
