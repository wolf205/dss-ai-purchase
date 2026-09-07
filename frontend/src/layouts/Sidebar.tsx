import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Grid,
  TrendingUp,
  Sparkles,
  ShoppingCart,
  Package,
  Truck,
  UploadCloud,
  Users,
  Sliders,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../features/auth/hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navSections = [
    {
      title: 'Hỗ Trợ Ra Quyết Định (DSS)',
      items: [
        { to: '/inventory', label: 'Tồn Kho & Cảnh Báo', icon: Boxes },
        { to: '/inventory/abc-xyz', label: 'Ma Trận ABC - XYZ', icon: Grid },
        { to: '/forecasting', label: 'Dự Báo Nhu Cầu AI', icon: TrendingUp },
        { to: '/recommendations', label: 'Khuyến Nghị Mua Hàng', icon: Sparkles, highlight: true },
      ],
    },
    {
      title: 'Giao Dịch Mua Hàng',
      items: [
        { to: '/purchase-orders', label: 'Đơn Mua Hàng (PO)', icon: ShoppingCart },
        { to: '/suppliers/evaluations', label: 'Xếp Hạng Đối Tác', icon: ShieldCheck },
      ],
    },
    {
      title: 'Dữ Liệu Cơ Sở (Master Data)',
      items: [
        { to: '/products', label: 'Danh Mục Sản Phẩm', icon: Package },
        { to: '/suppliers', label: 'Nhà Cung Cấp', icon: Truck },
        { to: '/data-import', label: 'Nạp File Bán Hàng', icon: UploadCloud },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Quản Trị Hệ Thống (Admin)',
            items: [
              { to: '/system/users', label: 'Tài Khoản & Quyền', icon: Users },
              { to: '/system/weights', label: 'Trọng Số Đánh Giá NCC', icon: Sliders },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        'h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 select-none z-30 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white shadow-md shadow-brand-500/20 flex-shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wide text-white font-mono">
                DSS PURCHASE
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                AI Powered Decision
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {!collapsed && (
              <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
                        item.highlight && !isActive && 'text-amber-400 font-semibold'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                        item.highlight && 'text-amber-400'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {item.highlight && !collapsed && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className={cn('flex items-center gap-3 px-2 py-1.5 rounded-lg', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{user?.fullName || 'Người dùng'}</span>
              <span className="text-[10px] text-slate-400 capitalize">
                {user?.role === 'ADMIN' ? 'Quản Trị Viên (Admin)' : 'Nhân Viên Mua Hàng (Staff)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
