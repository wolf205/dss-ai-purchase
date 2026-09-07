import React, { useState, useEffect } from 'react';
import { Sliders, Save, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import supplierApi from '../../suppliers/api/supplierApi';
import { SupplierWeightConfig } from '../../suppliers/types/supplier.types';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';
import { cn } from '../../../lib/utils';

export const SupplierWeightsPage: React.FC = () => {
  const [weights, setWeights] = useState<SupplierWeightConfig>({
    weightOtif: 35.0,
    weightQuality: 30.0,
    weightPrice: 20.0,
    weightLeadTime: 15.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchWeights = async () => {
    setLoading(true);
    try {
      const data = await supplierApi.getWeights();
      setWeights(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const sumWeights =
    Number(weights.weightOtif || 0) +
    Number(weights.weightQuality || 0) +
    Number(weights.weightPrice || 0) +
    Number(weights.weightLeadTime || 0);

  const isValidSum = Math.abs(sumWeights - 100.0) < 0.01;

  const handleSliderChange = (key: keyof SupplierWeightConfig, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!isValidSum) {
      setSaveError(`Tổng 4 trọng số phải bằng chính xác 100% (Hiện tại: ${sumWeights}%).`);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await supplierApi.updateWeights(weights);
      setSaveSuccess('Đã lưu thành công bộ trọng số mới! Hệ thống đã tự động tính lại điểm đánh giá cho toàn bộ nhà cung cấp (BR-013).');
    } catch (err: any) {
      setSaveError(err.response?.data?.error?.message || 'Không thể lưu bộ trọng số.');
    } finally {
      setSaving(false);
    }
  };

  const criteriaList = [
    {
      key: 'weightOtif' as keyof SupplierWeightConfig,
      name: 'Giao Hàng Đúng Hạn & Đủ Số Lượng (OTIF)',
      desc: 'Tỷ lệ các đơn hàng được giao đúng hẹn và đáp ứng đầy đủ số lượng đặt',
      color: 'accent-emerald-600',
    },
    {
      key: 'weightQuality' as keyof SupplierWeightConfig,
      name: 'Chất Lượng Hàng Hóa (Quality)',
      desc: 'Tỷ lệ hàng hóa đạt tiêu chuẩn kiểm nghiệm, không bị móp méo hay hư hại',
      color: 'accent-sky-600',
    },
    {
      key: 'weightPrice' as keyof SupplierWeightConfig,
      name: 'Mức Độ Cạnh Tranh Về Giá (Price)',
      desc: 'Đơn giá nhập so với bình quân thị trường và các đơn vị cùng phân khúc',
      color: 'accent-amber-600',
    },
    {
      key: 'weightLeadTime' as keyof SupplierWeightConfig,
      name: 'Thời Gian Đáp Ứng Giao Hàng (Lead Time)',
      desc: 'Tốc độ giao hàng kể từ khi chốt đơn đặt hàng PO',
      color: 'accent-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-brand-600" />
            Cấu Hình Trọng Số Đánh Giá Nhà Cung Cấp (UC-017)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều chỉnh tỷ trọng % của 4 tiêu chí đánh giá đối tác cung ứng. Ràng buộc toán học tổng bắt buộc bằng 100% (BR-013, FR-034)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchWeights}
            disabled={loading}
          >
            Khôi Phục
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            isLoading={saving}
            disabled={!isValidSum || loading}
          >
            Lưu Bộ Trọng Số
          </Button>
        </div>
      </div>

      {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
      {saveError && <Alert variant="error">{saveError}</Alert>}

      {/* Sum Indicator Card */}
      <div
        className={cn(
          'p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm',
          isValidSum
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        )}
      >
        <div className="flex items-center gap-3">
          {isValidSum ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold">
              {isValidSum
                ? 'Tổng Trọng Số Hợp Lệ (Đúng 100%)'
                : 'Vi Phạm Ràng Buộc: Tổng Trọng Số Khác 100%'}
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {isValidSum
                ? 'Đủ điều kiện lưu. Khi bấm lưu, toàn bộ bảng xếp hạng đối tác sẽ tự động được cập nhật lại.'
                : `Vui lòng tăng hoặc giảm các thanh trượt sao cho tổng bằng chính xác 100% (Đang thiếu/thừa: ${(100 - sumWeights).toFixed(1)}%).`}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">Tổng Hiện Tại</div>
          <div className="text-3xl font-black">{sumWeights.toFixed(1)}%</div>
        </div>
      </div>

      {/* Sliders Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800">4 Tiêu Chí Chấm Điểm Hiệu Suất NCC</h3>

        <div className="space-y-6">
          {criteriaList.map((item) => {
            const currentVal = Number(weights[item.key] ?? 0);
            return (
              <div key={item.key} className="space-y-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-brand-600 font-mono">
                      {currentVal.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(item.key, Number(e.target.value))}
                    className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${item.color}`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0% (Không tính)</span>
                    <span>50%</span>
                    <span>100% (Chi phối tuyệt đối)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupplierWeightsPage;
