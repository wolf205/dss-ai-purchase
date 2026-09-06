import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[variant];

  const variants = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  const iconColors = {
    info: 'text-sky-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-rose-600',
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm flex items-start gap-3 transition-all',
        variants[variant],
        className
      )}
      {...props}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[variant])} />
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-semibold">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-black/5 transition-colors text-slate-500"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
