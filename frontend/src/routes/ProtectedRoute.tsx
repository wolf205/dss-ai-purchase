import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { UserRole } from '../features/auth/types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-xs text-slate-400">Đang kiểm tra phiên làm việc...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
          <span className="text-2xl font-bold">403</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không Có Quyền Truy Cập</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Chức năng này được bảo vệ bởi cơ chế phân quyền RBAC và chỉ dành cho vai trò:{' '}
          <strong className="text-slate-800">{allowedRoles.join(', ')}</strong>.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
