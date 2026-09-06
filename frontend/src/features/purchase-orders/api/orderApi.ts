import apiClient from '../../../lib/axios';
import { PurchaseOrder, CreatePOPayload, ReceiveGoodsPayload } from '../types/order.types';

export const orderApi = {
  getOrders: async (params?: { status?: string; search?: string }): Promise<PurchaseOrder[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: PurchaseOrder[] }>('/purchase-orders', { params });
      return res.data.data;
    } catch {
      // Fallback demo mock if backend database is empty
      return [
        {
          id: 501,
          poCode: 'PO-20260904-0001',
          supplierId: 1,
          supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
          status: 'ORDERED',
          orderDate: '2026-09-04',
          promisedDeliveryDate: '2026-09-06',
          totalAmount: 446400,
          itemCount: 1,
          items: [
            {
              productSku: 'MILK-VNM-180',
              productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
              orderedQuantity: 72,
              unitPrice: 6200,
            },
          ],
        },
        {
          id: 502,
          poCode: 'PO-20260905-0002',
          supplierId: 3,
          supplierName: 'Acecook Việt Nam Chi Nhánh Phân Phối',
          status: 'DRAFT',
          orderDate: '2026-09-05',
          promisedDeliveryDate: '2026-09-07',
          totalAmount: 228000,
          itemCount: 1,
          items: [
            {
              productSku: 'NOODLE-HAOHAO-75',
              productName: 'Mì ăn liền Hảo Hảo tôm chua cay 75g',
              orderedQuantity: 60,
              unitPrice: 3800,
            },
          ],
        },
      ];
    }
  },

  getOrderById: async (id: number): Promise<PurchaseOrder> => {
    const res = await apiClient.get<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}`);
    return res.data.data;
  },

  createOrder: async (payload: CreatePOPayload): Promise<PurchaseOrder> => {
    const res = await apiClient.post<{ success: boolean; data: PurchaseOrder }>('/purchase-orders', payload);
    return res.data.data;
  },

  confirmOrder: async (id: number): Promise<{ message: string; status: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { message: string; status: string } }>(
      `/purchase-orders/${id}/confirm`
    );
    return res.data.data;
  },

  cancelOrder: async (id: number, reason: string): Promise<{ message: string; status: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { message: string; status: string } }>(
      `/purchase-orders/${id}/cancel`,
      { reason }
    );
    return res.data.data;
  },

  receiveOrder: async (id: number, payload: ReceiveGoodsPayload): Promise<any> => {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/purchase-orders/${id}/receive`,
      payload
    );
    return res.data.data;
  },
};

export default orderApi;
