import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';
import forecastApi from '../api/forecastApi';

interface ColdStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ColdStartModal: React.FC<ColdStartModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [sku, setSku] = useState('');
  const [expectedDailySales, setExpectedDailySales] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || expectedDailySales === '' || Number(expectedDailySales) <= 0) {
      setErrorMsg('Vui lòng nhập mã SKU và lượng bán dự kiến hợp lệ (> 0).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await forecastApi.saveColdStart({
        sku: sku.trim(),
        expectedDailySales: Number(expectedDailySales),
        notes: notes.trim(),
      });
      setSuccessMsg(`Thành công: ${res.message} (Tồn an toàn ban đầu: ${res.calculatedSafetyStock})`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSku('');
        setExpectedDailySales('');
        setNotes('');
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Không thể lưu lượng bán dự kiến.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Xử Lý Sản Phẩm Mới (Cold Start - UC-008)</span>
        </div>
      }
      description="Sản phẩm chưa có đủ 14 ngày dữ liệu bán hàng lịch sử để AI dự báo tự động (FR-016)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <Input
          label="Mã SKU Sản Phẩm Mới"
          placeholder="Ví dụ: NEW-SNACK-OISHI"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
        />

        <Input
          type="number"
          min="1"
          step="1"
          label="Lượng Tiêu Thụ Dự Kiến Mỗi Ngày (D_expected)"
          placeholder="Số lượng bán ước tính/ngày..."
          value={expectedDailySales}
          onChange={(e) => setExpectedDailySales(e.target.value === '' ? '' : Number(e.target.value))}
          required
          helperText="Hệ thống sẽ dùng giá trị này để tính mức tồn an toàn khởi tạo (Safety Stock = 2 × D_expected)."
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700">
            Ghi Chú Căn Cứ Ước Lượng (Tùy chọn)
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            rows={3}
            placeholder="Ví dụ: Tham khảo doanh số mặt hàng tương đương cùng phân khúc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Lưu Thiết Lập
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ColdStartModal;
