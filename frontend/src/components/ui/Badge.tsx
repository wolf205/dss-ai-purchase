import React from 'react';
import { cn } from '../../lib/utils';

export type RiskLevel = 
  | 'OUT_OF_STOCK' 
  | 'CRITICAL' 
  | 'WARNING' 
  | 'NORMAL' 
  | 'HEALTHY' 
  | 'OVERSTOCK' 
  | 'DEAD_STOCK';

export type POStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  riskLevel?: RiskLevel | string;
  poStatus?: POStatus | string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  riskLevel,
  poStatus,
  dot = false,
  ...props
}) => {
  // If riskLevel is provided, use standard BR-002 styling
  if (riskLevel) {
    const normalized = riskLevel.toUpperCase();
    let riskStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotColor = 'bg-slate-400';
    let label = riskLevel;

    switch (normalized) {
      case 'OUT_OF_STOCK':
        riskStyles = 'bg-red-50 text-red-700 border-red-200 font-semibold';
        dotColor = 'bg-red-600';
        label = 'Hết hàng';
        break;
      case 'CRITICAL':
        riskStyles = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
        dotColor = 'bg-orange-600';
        label = 'Nguy cấp';
        break;
      case 'WARNING':
        riskStyles = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        dotColor = 'bg-amber-500';
        label = 'Cảnh báo';
        break;
      case 'NORMAL':
      case 'HEALTHY':
        riskStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        dotColor = 'bg-emerald-500';
        label = 'An toàn';
        break;
      case 'OVERSTOCK':
        riskStyles = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
        dotColor = 'bg-purple-600';
        label = 'Tồn dư';
        break;
      case 'DEAD_STOCK':
        riskStyles = 'bg-slate-100 text-slate-600 border-slate-300 font-medium';
        dotColor = 'bg-slate-500';
        label = 'Bất động';
        break;
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide transition-colors',
          riskStyles,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
        {children || label}
      </span>
    );
  }

  // If PO Status is provided
  if (poStatus) {
    const normalized = poStatus.toUpperCase();
    let poStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotColor = 'bg-slate-400';
    let label = poStatus;

    switch (normalized) {
      case 'DRAFT':
        poStyles = 'bg-slate-100 text-slate-700 border-slate-300';
        dotColor = 'bg-slate-400';
        label = 'Bản nháp (DRAFT)';
        break;
      case 'ORDERED':
        poStyles = 'bg-sky-50 text-sky-700 border-sky-300 font-semibold';
        dotColor = 'bg-sky-600';
        label = 'Đã chốt đặt (ORDERED)';
        break;
      case 'RECEIVED':
        poStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
        dotColor = 'bg-emerald-600';
        label = 'Đã nhận hàng (RECEIVED)';
        break;
      case 'CANCELLED':
        poStyles = 'bg-rose-50 text-rose-700 border-rose-300 font-medium';
        dotColor = 'bg-rose-500';
        label = 'Đã hủy (CANCELLED)';
        break;
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide transition-colors',
          poStyles,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
        {children || label}
      </span>
    );
  }

  // Generic variants
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    outline: 'bg-transparent text-slate-600 border-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export default Badge;
