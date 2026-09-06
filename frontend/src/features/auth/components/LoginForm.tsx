import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate('/inventory');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h2>
        <p className="text-xs text-slate-500">
          Nhập thông tin xác thực để truy cập bảng điều khiển DSS
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên đăng nhập"
          leftIcon={<UserIcon className="w-4 h-4" />}
          placeholder="admin hoặc staff..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />

        <Input
          type="password"
          label="Mật khẩu"
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Đăng Nhập
        </Button>
      </form>

      {/* Quick Demo Accounts Selection */}
      <div className="pt-4 border-t border-slate-100 space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
          Tài Khoản Mẫu Thử Nghiệm (Seed Demo)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin', 'SecurePassword@2026')}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center gap-2 group"
          >
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">Admin</div>
              <div className="text-[10px] text-slate-400 truncate">Quản trị viên</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('staff01', 'StaffPassword@123')}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center gap-2 group"
          >
            <UserCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">Staff</div>
              <div className="text-[10px] text-slate-400 truncate">Nhân viên mua hàng</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
