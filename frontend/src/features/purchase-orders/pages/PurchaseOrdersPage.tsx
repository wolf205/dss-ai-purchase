import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import orderApi from '../api/orderApi';
import { PurchaseOrder } from '../types/order.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Alert from '../../../components/ui/Toast';
import ReceiptModal from '../../goods-receipt/components/ReceiptModal';
import { formatCurrency, formatDate } from '../../../lib/formatters';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<PurchaseOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<PurchaseOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New PO Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const location = useLocation();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getOrders({ status: selectedStatus || undefined });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // If navigated with prefilled items from Recommendations
  useEffect(() => {
    if (location.state?.prefilledItems) {
      setShowCreateModal(true);
    }
  }, [location.state]);

  const handleConfirmOrder = async (id: number) => {
    setActionLoading(true);
    try {
      await orderApi.confirmOrder(id);
      setToastMsg({
        type: 'success',
        text: 'Đã chốt đơn hàng (ORDERED). Lượng hàng chờ về (On-Order) đã được tự động tăng lên để chống đặt trùng (BR-001)!',
      });
      await fetchOrders();
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể chốt đơn hàng.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng.');
      return;
    }

    setActionLoading(true);
    try {
      await orderApi.cancelOrder(cancelModalOrder.id, cancelReason);
      setToastMsg({
        type: 'success',
        text: 'Đã hủy đơn mua hàng. Lượng hàng On-Order đã được giải phóng (BR-017).',
      });
      setCancelModalOrder(null);
      setCancelReason('');
      await fetchOrders();
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể hủy đơn hàng.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const statusTabs: { label: string; value: string }[] = [
    { label: 'Tất Cả', value: '' },
    { label: 'Bản Nháp (DRAFT)', value: 'DRAFT' },
    { label: 'Đã Đặt (ORDERED)', value: 'ORDERED' },
    { label: 'Đã Nhận (RECEIVED)', value: 'RECEIVED' },
    { label: 'Đã Hủy (CANCELLED)', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-brand-600" />
            Quản Lý Đơn Mua Hàng & Nhận Hàng (UC-012, UC-013, UC-014)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Máy trạng thái 4 cấp độ (DRAFT → ORDERED → RECEIVED/CANCELLED) và giao dịch nhận hàng nguyên tử ACID (BR-025)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Làm Mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Tạo Đơn PO Mới (UC-012)
          </Button>
        </div>
      </div>

      {toastMsg && (
        <Alert
          variant={toastMsg.type === 'success' ? 'success' : 'error'}
          onClose={() => setToastMsg(null)}
        >
          {toastMsg.text}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedStatus === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PO History Table */}
      <Table isLoading={loading} isEmpty={orders.length === 0} colSpan={7}>
        <TableHeader>
          <TableRow>
            <TableHead>Mã Đơn PO</TableHead>
            <TableHead>Nhà Cung Cấp</TableHead>
            <TableHead>Ngày Đặt Hàng</TableHead>
            <TableHead>Hẹn Giao Hàng</TableHead>
            <TableHead className="text-right">Tổng Tiền</TableHead>
            <TableHead className="text-center">Trạng Thái (BR-025)</TableHead>
            <TableHead className="text-right">Thao Tác Nghiệp Vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-mono font-bold text-xs text-brand-600">
                {po.poCode}
              </TableCell>
              <TableCell className="font-semibold text-slate-800">
                {po.supplierName || `Nhà cung cấp #${po.supplierId}`}
              </TableCell>
              <TableCell className="text-xs text-slate-600">{formatDate(po.orderDate)}</TableCell>
              <TableCell className="text-xs text-slate-600">
                {formatDate(po.promisedDeliveryDate)}
              </TableCell>
              <TableCell className="text-right font-black text-slate-900">
                {formatCurrency(po.totalAmount)}
              </TableCell>
              <TableCell className="text-center">
                <Badge poStatus={po.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Action 1: Confirm DRAFT -> ORDERED */}
                  {po.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleConfirmOrder(po.id)}
                      disabled={actionLoading}
                    >
                      Chốt Đặt
                    </Button>
                  )}

                  {/* Action 2: Receive ORDERED -> RECEIVED */}
                  {po.status === 'ORDERED' && (
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                      onClick={() => setActiveReceiptOrder(po)}
                    >
                      Nhận Hàng (UC-014)
                    </Button>
                  )}

                  {/* Action 3: Cancel PO */}
                  {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => setCancelModalOrder(po)}
                      disabled={actionLoading}
                    >
                      Hủy
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Goods Receipt Modal (UC-014) */}
      <ReceiptModal
        order={activeReceiptOrder}
        isOpen={!!activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        onSuccess={fetchOrders}
      />

      {/* Cancel Order Modal */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        size="md"
        title="Hủy Đơn Mua Hàng (UC-013)"
        description={`Xác nhận hủy đơn ${cancelModalOrder?.poCode}. Nếu đơn đã chốt (ORDERED), lượng On-Order sẽ được tự động giải phóng về 0 (BR-017).`}
      >
        <div className="space-y-4">
          <Input
            label="Lý Do Hủy Đơn"
            placeholder="Ví dụ: Đối tác thông báo đứt hàng đột xuất..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCancelModalOrder(null)}
              disabled={actionLoading}
            >
              Quay Lại
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelOrder}
              isLoading={actionLoading}
            >
              Xác Nhận Hủy Đơn
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create PO Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
        title="Lập Đơn Mua Hàng Mới (PO - UC-012)"
        description="Đơn hàng được lưu ở trạng thái DRAFT. Bạn có thể kiểm tra trước khi bấm 'Chốt Đặt' (ORDERED)."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 leading-relaxed">
            Hệ thống hỗ trợ tự động điền danh sách sản phẩm từ Khuyến Nghị Mua Hàng DSS (UC-010). Khi tạo xong, đơn hàng sẽ được gán mã chuẩn tự động <code>PO-YYYYMMDD-XXXX</code> (BR-024).
          </div>

          <Input label="Ngày Hẹn Giao Hàng Dự Kiến" type="date" required />
          <Input label="Ghi Chú Đặt Hàng" placeholder="Ví dụ: Giao vào giờ hành chính..." />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Tạo đơn mua hàng mẫu thành công!');
                setShowCreateModal(false);
                fetchOrders();
              }}
            >
              Lưu Bản Nháp (DRAFT)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
