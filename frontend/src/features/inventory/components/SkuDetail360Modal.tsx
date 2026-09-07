import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Truck, ShieldAlert, Award, Loader2, Cpu } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { Sku360Data } from '../types/inventory.types';
import inventoryApi from '../api/inventoryApi';
import TimeSeriesForecastChart from '../../../components/charts/TimeSeriesForecastChart';
import { formatCurrency, formatDaysOfSupply } from '../../../lib/formatters';

interface SkuDetail360ModalProps {
  sku: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SkuDetail360Modal: React.FC<SkuDetail360ModalProps> = ({ sku, isOpen, onClose }) => {
  const [data, setData] = useState<Sku360Data | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sku && isOpen) {
      setLoading(true);
      inventoryApi
        .getSku360(sku)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [sku, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      allowMaximize={true}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{data?.name || 'Chi Tiết Sản Phẩm 360° (UC-006)'}</span>
              {data && <Badge riskLevel={data.inventory.riskLevel} />}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              SKU: {data?.sku} • Ngành hàng: {data?.category}
            </div>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs">Đang tải toàn cảnh phân tích sản phẩm 360°...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Section 1: Real-time Inventory Status Metrics */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Chỉ Số Tồn Kho & Vị Trí Tồn Thực Tế (Real-time Inventory Position)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Tồn Khả Dụng (On-Hand)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{data.inventory.onHand}</div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-900">
                <div className="text-[11px] text-sky-700 font-medium">Đang Chờ Về (On-Order)</div>
                <div className="text-lg font-black text-sky-900 mt-0.5">{data.inventory.onOrder}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white">
                <div className="text-[11px] text-slate-400 font-medium">Vị Trí Tồn (IP)</div>
                <div className="text-lg font-black text-white mt-0.5">{data.inventory.ip}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Tồn An Toàn (SS)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{data.inventory.ss}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="text-[11px] text-amber-700 font-medium">Điểm Đặt Hàng (ROP)</div>
                <div className="text-lg font-black text-amber-900 mt-0.5">{data.inventory.rop}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Số Ngày Đủ Bán (DoS)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {formatDaysOfSupply(data.inventory.dos)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Classification ABC-XYZ */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-black text-xl text-slate-900 tracking-wider">
                {data.classification.segment}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Phân Loại Ma Trận 9 Ô: Nhóm {data.classification.abcClass} (Doanh Thu) & Nhóm {data.classification.xyzClass} (Biến Động)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Hệ số biến thiên CV: <strong>{data.classification.cv.toFixed(2)}</strong> (CV ≤ 0.5: Ổn định, dự báo AI đạt độ chính xác cao)
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Time Series Forecast Chart (UC-007, FR-014) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                Lịch Sử Tiêu Thụ & Dự Báo AI 14 Ngày Tới (Kèm Dải Tin Cậy 95%)
              </h4>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
                  <Cpu className="w-3 h-3 text-indigo-600" />
                  Holt-Winters (Dự Báo AI)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                  Dải tin cậy 95%
                </span>
              </div>
            </div>
            {data.forecastPoints ? (
              <TimeSeriesForecastChart
                data={data.forecastPoints}
                sku={data.sku}
                productName={data.name}
                showTitle={false}
                height="340px"
              />
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Không có dữ liệu dự báo.</div>
            )}
          </div>

          {/* Section 4: Supplier Terms & Pricing Comparison */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-slate-400" />
              Đối Tác Cung Ứng & Điều Khoản Đặt Hàng
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3.5 py-2.5">Nhà Cung Cấp</th>
                    <th className="px-3.5 py-2.5 text-right">Đơn Giá Nhập</th>
                    <th className="px-3.5 py-2.5 text-center">MOQ</th>
                    <th className="px-3.5 py-2.5 text-center">Pack Size</th>
                    <th className="px-3.5 py-2.5 text-center">Lead Time</th>
                    <th className="px-3.5 py-2.5 text-right">Điểm Hiệu Suất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.suppliers.map((sup, idx) => (
                    <tr key={sup.supplierId} className={idx === 0 ? 'bg-emerald-50/40 font-medium' : ''}>
                      <td className="px-3.5 py-2.5 flex items-center gap-1.5">
                        {idx === 0 && <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                        <span>{sup.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Tối Ưu
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(sup.purchasePrice)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">{sup.moq} đơn vị</td>
                      <td className="px-3.5 py-2.5 text-center">{sup.packSize} / thùng</td>
                      <td className="px-3.5 py-2.5 text-center">{sup.leadTime} ngày</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-brand-600">{sup.score} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default SkuDetail360Modal;
