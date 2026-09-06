import React from 'react';
import {
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  PackagePlus,
  Clock,
} from 'lucide-react';
import { KpiSummary } from '../types/inventory.types';
import { cn } from '../../../lib/utils';
import { RiskLevel } from '../../../components/ui/Badge';

interface KpiRiskCardsProps {
  summary?: KpiSummary;
  selectedRisk?: RiskLevel | string | null;
  onSelectRisk?: (risk: RiskLevel | null) => void;
}

export const KpiRiskCards: React.FC<KpiRiskCardsProps> = ({
  summary = {
    outOfStock: 0,
    critical: 0,
    warning: 0,
    normal: 0,
    overstock: 0,
    deadStock: 0,
  },
  selectedRisk,
  onSelectRisk,
}) => {
  const cards = [
    {
      code: 'OUT_OF_STOCK' as RiskLevel,
      name: 'Hết Hàng',
      count: summary.outOfStock,
      icon: TrendingDown,
      bg: 'bg-red-500/10 text-red-700 border-red-200',
      activeRing: 'ring-2 ring-red-500 bg-red-50',
      dotColor: 'bg-red-600',
      desc: 'Tồn kho = 0, cần đặt gấp',
    },
    {
      code: 'CRITICAL' as RiskLevel,
      name: 'Nguy Cấp',
      count: summary.critical,
      icon: AlertCircle,
      bg: 'bg-orange-500/10 text-orange-700 border-orange-200',
      activeRing: 'ring-2 ring-orange-500 bg-orange-50',
      dotColor: 'bg-orange-600',
      desc: 'Tồn ≤ SS hoặc DoS ≤ 3 ngày',
    },
    {
      code: 'WARNING' as RiskLevel,
      name: 'Cần Đặt Hàng',
      count: summary.warning,
      icon: AlertTriangle,
      bg: 'bg-amber-500/10 text-amber-700 border-amber-200',
      activeRing: 'ring-2 ring-amber-500 bg-amber-50',
      dotColor: 'bg-amber-500',
      desc: 'SS < Tồn ≤ ROP',
    },
    {
      code: 'NORMAL' as RiskLevel,
      name: 'Tồn An Toàn',
      count: summary.normal,
      icon: ShieldCheck,
      bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-50',
      dotColor: 'bg-emerald-500',
      desc: 'ROP < Tồn ≤ 2×ROP',
    },
    {
      code: 'OVERSTOCK' as RiskLevel,
      name: 'Tồn Dư Thừa',
      count: summary.overstock,
      icon: PackagePlus,
      bg: 'bg-purple-500/10 text-purple-700 border-purple-200',
      activeRing: 'ring-2 ring-purple-500 bg-purple-50',
      dotColor: 'bg-purple-600',
      desc: 'Tồn > 2×ROP hoặc DoS > 30 ngày',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Phân Phối 5 Cấp Độ Rủi Ro Tồn Kho (BR-002)
        </h3>
        {selectedRisk && (
          <button
            onClick={() => onSelectRisk?.(null)}
            className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
          >
            ✕ Xem tất cả SKU
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedRisk === card.code;

          return (
            <div
              key={card.code}
              onClick={() => onSelectRisk?.(isSelected ? null : card.code)}
              className={cn(
                'p-4 rounded-xl border bg-white cursor-pointer transition-all duration-150 flex flex-col justify-between select-none shadow-xs hover:shadow-md hover:border-slate-300',
                isSelected && card.activeRing
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', card.dotColor)} />
                  <span className="text-xs font-bold text-slate-700">{card.name}</span>
                </div>
                <div className={cn('p-1.5 rounded-lg border', card.bg)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-1">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.count}{' '}
                  <span className="text-xs font-normal text-slate-400">SKU</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">{card.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {summary.deadStock > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>
              Phát hiện <strong>{summary.deadStock} SKU</strong> hàng tồn bất động (Dead Stock: không có doanh số trong 60+ ngày).
            </span>
          </div>
          <button
            onClick={() => onSelectRisk?.('DEAD_STOCK' as RiskLevel)}
            className="font-bold text-slate-800 hover:text-brand-600 hover:underline"
          >
            Lọc Hàng Bất Động →
          </button>
        </div>
      )}
    </div>
  );
};

export default KpiRiskCards;
