import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';
import { PurchaseOrder } from '../../purchase-orders/types/order.types';
import orderApi from '../../purchase-orders/api/orderApi';

interface ReceiptModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemReceiptState {
  sku: string;
  name: string;
  ordered: number;
  delivered: number;
  defective: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [actualDate, setActualDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemReceiptState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      const orderItems = order.items && order.items.length > 0
        ? order.items
        : [
            {
              productSku: 'MILK-VNM-180',
              productName: 'Sữa tươi tiệt trùng Vinamilk 180ml',
              orderedQuantity: 72,
              unitPrice: 6200,
            },
          ];

      setItems(
        orderItems.map((item) => ({
          sku: item.productSku,
          name: item.productName || item.productSku,
          ordered: item.orderedQuantity,
          delivered: item.orderedQuantity,
          defective: 0,
        }))
      );
      setActualDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [order, isOpen]);

  const handleDeliveredChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index].delivered = Math.max(0, val);
    setItems(updated);
  };

  const handleDefectiveChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index].defective = Math.max(0, val);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validate defect <= delivered (BR-019)
    for (const item of items) {
      if (item.defective > item.delivered) {
        setErrorMsg(
          `Lỗi hàng tại SKU ${item.sku}: Số lượng lỗi (${item.defective}) không được vượt quá số lượng thực giao (${item.delivered}).`
        );
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        actualDeliveryDate: actualDate,
        notes: notes.trim(),
        items: items.map((i) => ({
          sku: i.sku,
          deliveredQuantity: i.delivered,
          defectiveQuantity: i.defective,
        })),
      };

      await orderApi.receiveOrder(order.id, payload);
      setSuccessMsg('Ghi nhận nhận hàng thành công! Tồn kho On-Hand đã được cập nhật nguyên tử.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Không thể ghi nhận nhận hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">
              Nghiệm Thu Nhận Hàng Kho (UC-014 - Mã: {order.poCode})
            </div>
            <div className="text-xs text-slate-500">
              Đối tác: <strong>{order.supplierName}</strong> • Ngày hẹn giao: {order.promisedDeliveryDate || 'N/A'}
            </div>
          </div>
        </div>
      }
      description="Giao dịch nguyên tử ACID: Tăng On-Hand, Xóa On-Order, Đóng trạng thái RECEIVED và ghi nhận điểm OTIF (BR-018, BR-019)."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Ngày Thực Nhận Hàng"
            value={actualDate}
            onChange={(e) => setActualDate(e.target.value)}
            required
          />

          <Input
            label="Ghi chú nhận hàng / Tình trạng bao bì"
            placeholder="Ví dụ: Đủ hàng, có 2 hộp bị móp nhẹ bên ngoài..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Item inspection rows */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chi Tiết Nghiệm Thu Từng Mặt Hàng
          </label>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Sản Phẩm</th>
                  <th className="px-3 py-2.5 text-center">Đặt (PO)</th>
                  <th className="px-3 py-2.5 text-center w-28">Thực Giao (Q_del)</th>
                  <th className="px-3 py-2.5 text-center w-28">Hàng Lỗi (Q_def)</th>
                  <th className="px-3 py-2.5 text-right">Nhập Kho (Q_acc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const accepted = Math.max(0, item.delivered - item.defective);
                  return (
                    <tr key={item.sku} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-600">
                        {item.ordered}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.delivered}
                          onChange={(e) => handleDeliveredChange(idx, Number(e.target.value))}
                          className="w-20 text-center py-1 border border-slate-300 rounded-md font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.defective}
                          onChange={(e) => handleDefectiveChange(idx, Number(e.target.value))}
                          className="w-20 text-center py-1 border border-rose-300 bg-rose-50 text-rose-700 rounded-md font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-sm text-emerald-600">
                        +{accepted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACID Guarantee note */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Hệ thống đảm bảo tính toàn vẹn giao dịch nguyên tử (ACID Transaction): Khi bấm xác nhận, lượng tồn On-Hand sẽ tăng đúng bằng số lượng thực nhập (Q_accepted), lượng On-Order được giải phóng về 0 và trạng thái đơn hàng đóng lại vĩnh viễn.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy Bỏ
          </Button>
          <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700" isLoading={isLoading}>
            Xác Nhận Nhận Hàng & Cập Nhật Kho
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiptModal;

