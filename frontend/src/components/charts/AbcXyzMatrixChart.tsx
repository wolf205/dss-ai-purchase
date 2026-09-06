import React from 'react';
import { cn } from '../../lib/utils';

export interface MatrixCellData {
  segment: string;
  skuCount: number;
  revenuePct: number;
  description?: string;
}

export interface AbcXyzMatrixChartProps {
  data: Record<string, MatrixCellData>;
  selectedSegment?: string | null;
  onSelectSegment?: (segment: string | null) => void;
}

export const AbcXyzMatrixChart: React.FC<AbcXyzMatrixChartProps> = ({
  data,
  selectedSegment,
  onSelectSegment,
}) => {
  const rows = [
    { key: 'A', title: 'Nhóm A (80% Doanh thu)' },
    { key: 'B', title: 'Nhóm B (15% Doanh thu)' },
    { key: 'C', title: 'Nhóm C (5% Doanh thu)' },
  ];

  const cols = [
    { key: 'X', title: 'Nhóm X (CV ≤ 0.5: Ổn định cao)' },
    { key: 'Y', title: 'Nhóm Y (0.5 < CV ≤ 1.0: Biến động vừa)' },
    { key: 'Z', title: 'Nhóm Z (CV > 1.0: Khó đoán/Thất thường)' },
  ];

  // Importance color schemes for 9 cells
  const getCellColor = (seg: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-brand-50 border-brand-600 ring-2 ring-brand-500 shadow-md';
    }
    switch (seg) {
      case 'AX':
        return 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 text-emerald-950';
      case 'AY':
      case 'BX':
        return 'bg-sky-50/70 border-sky-300 hover:border-sky-500 text-sky-950';
      case 'AZ':
      case 'BY':
      case 'CX':
        return 'bg-amber-50/60 border-amber-300 hover:border-amber-500 text-amber-950';
      case 'BZ':
      case 'CY':
        return 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-800';
      case 'CZ':
        return 'bg-rose-50/50 border-rose-200 hover:border-rose-400 text-rose-950';
      default:
        return 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Ma Trận 9 Ô Phân Loại Hàng Hóa ABC - XYZ</h3>
          <p className="text-xs text-slate-500">
            Kết hợp tỷ trọng Doanh thu (Pareto ABC) và Độ ổn định tiêu thụ (Hệ số biến thiên CV XYZ)
          </p>
        </div>
        {selectedSegment && (
          <button
            onClick={() => onSelectSegment?.(null)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline self-start sm:self-auto"
          >
            ✕ Bỏ lọc ô ({selectedSegment})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-4 gap-2.5 text-center">
          {/* Header Row */}
          <div className="p-2 font-bold text-xs text-slate-400 flex items-center justify-center">
            ABC \ XYZ
          </div>
          {cols.map((col) => (
            <div key={col.key} className="p-2 bg-slate-100/80 rounded-lg text-xs font-bold text-slate-700">
              {col.title}
            </div>
          ))}

          {/* 3 Rows */}
          {rows.map((row) => (
            <React.Fragment key={row.key}>
              <div className="p-2 bg-slate-100/80 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center">
                {row.title}
              </div>
              {cols.map((col) => {
                const seg = `${row.key}${col.key}`;
                const cell = data[seg] || { segment: seg, skuCount: 0, revenuePct: 0 };
                const isSelected = selectedSegment === seg;

                return (
                  <div
                    key={seg}
                    onClick={() => onSelectSegment?.(isSelected ? null : seg)}
                    className={cn(
                      'p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between select-none relative group',
                      getCellColor(seg, isSelected)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base tracking-tight">{seg}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 font-bold shadow-xs border border-black/5">
                        {cell.skuCount} SKU
                      </span>
                    </div>
                    <div className="mt-2 text-left">
                      <div className="text-xs font-semibold">
                        {cell.revenuePct.toFixed(1)}% <span className="font-normal text-slate-500 text-[10px]">doanh thu</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {seg === 'AX' ? 'Chiến lược: Tồn sẵn, ưu tiên tự động' : seg === 'CZ' ? 'Xem xét: Đặt theo đơn, giảm tồn' : 'Giám sát định kỳ'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AbcXyzMatrixChart;
