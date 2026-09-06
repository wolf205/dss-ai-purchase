import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  colSpan?: number;
}

export const Table: React.FC<TableProps> = ({
  className,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  colSpan = 5,
  children,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className={cn('w-full text-left border-collapse text-sm', className)} {...props}>
        {children}
        {isLoading && (
          <tbody>
            <tr>
              <td colSpan={colSpan} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  <span className="text-xs">Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          </tbody>
        )}
        {!isLoading && isEmpty && (
          <tbody>
            <tr>
              <td colSpan={colSpan} className="py-12 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <thead className={cn('bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <tbody className={cn('divide-y divide-slate-100 text-slate-700', className)} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <tr className={cn('hover:bg-slate-50/60 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <th className={cn('px-4 py-3 text-xs font-semibold select-none', className)} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
};

export default Table;
