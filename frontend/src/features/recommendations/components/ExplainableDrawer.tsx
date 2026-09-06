import React from 'react';
import { HelpCircle, Calculator, CheckCircle2, Truck, Award } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { RecommendationItem } from '../types/recommendation.types';
import { formatCurrency } from '../../../lib/formatters';

interface ExplainableDrawerProps {
  item: RecommendationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainableDrawer: React.FC<ExplainableDrawerProps> = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Giải Trình Thuật Toán Đề Xuất (Explainable AI - FR-024)</span>
              <Badge riskLevel={item.urgencyLevel} />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {item.productName} ({item.sku})
            </div>
          </div>
        </div>
      }
      description="Minh bạch từng bước tính toán số lượng đề xuất và căn cứ lựa chọn đối tác cung ứng tối ưu."
    >
      <div className="space-y-6 text-sm">
        {/* Step 1: Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-1.5 shadow-md">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Kết Luận Khuyến Nghị
          </div>
          <p className="text-sm font-medium leading-relaxed">{item.explanationSummary}</p>
        </div>

        {/* Step 2: Math Step-by-Step Rounding Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-brand-600" />
            Các Bước Làm Tròn Số Lượng (BR-001, BR-009, BR-010)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Box 1: Raw Shortage */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">1. Thiếu Hụt Thô (Q_raw)</span>
              <div className="text-2xl font-black text-slate-900">
                {item.explanationFactors.rawShortage}{' '}
                <span className="text-xs font-normal text-slate-400">đơn vị</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Tính theo công thức: <strong>Demand + SS - IP</strong>
              </p>
            </div>

            {/* Box 2: MOQ Constraint */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">2. Áp Ngưỡng Tối Thiểu</span>
              <div className="text-2xl font-black text-slate-900">
                {item.explanationFactors.moqApplied}{' '}
                <span className="text-xs font-normal text-slate-400">MOQ</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Không nhỏ hơn MOQ cam kết của NCC ({item.recommendedSupplier.moq})
              </p>
            </div>

            {/* Box 3: Pack Size Multiple */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">3. Đề Xuất Đặt (Q_sug)</span>
              <div className="text-2xl font-black text-emerald-700">
                {item.suggestedQuantity}{' '}
                <span className="text-xs font-normal text-emerald-600">đơn vị</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Làm tròn lên bội số thùng/lốc: <strong>{item.suggestedQuantity / item.recommendedSupplier.packSize} thùng</strong> ({item.recommendedSupplier.packSize} cái/thùng)
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Supplier Justification */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-brand-600" />
            Căn Cứ Lựa Chọn Nhà Cung Cấp ({item.recommendedSupplier.name})
          </h4>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-slate-900">{item.recommendedSupplier.name}</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                Điểm Tổng: {item.recommendedSupplier.score} / 100
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 text-[10px]">Đơn Giá Nhập</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {formatCurrency(item.recommendedSupplier.unitPrice)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 text-[10px]">Đúng Hạn (OTIF)</div>
                <div className="font-bold text-emerald-600 mt-0.5">
                  {item.recommendedSupplier.otif}%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 text-[10px]">Thời Gian Giao</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {item.recommendedSupplier.leadTime} ngày
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 text-[10px]">Tổng Dự Toán Tiền</div>
                <div className="font-bold text-brand-600 mt-0.5">
                  {formatCurrency(item.estimatedTotalCost)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Duplicate Safety Guarantee */}
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-900">
          <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Bảo vệ chống đặt hàng trùng lặp (Anti-Duplicate BR-001):</strong> Vị trí tồn kho $IP = {item.onHand} + {item.onOrder} = {item.inventoryPosition}$ đã tự động tính gộp cả lượng hàng đang chờ về (On-Order). Nhân viên không phải lo ngại tình trạng đặt dư thừa khi có đơn PO đã xác nhận trước đó.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExplainableDrawer;
