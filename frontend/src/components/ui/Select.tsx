import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options = [], children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border text-sm text-slate-900 bg-white transition-colors py-2 px-3',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              error ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300',
              className
            )}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
