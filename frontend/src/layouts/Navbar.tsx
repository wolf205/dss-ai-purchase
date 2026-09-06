import React, { useState } from 'react';
import { LogOut, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Toast';
import authApi from '../features/auth/api/authApi';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setSuccessMsg('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        {/* Left: System status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Decision Engine Sẵn Sàng</span>
          </div>
          <span className="hidden md:inline-block text-xs text-slate-400">|</span>
          <span className="hidden md:inline-block text-xs text-slate-500">
            Hỗ trợ ra quyết định mua hàng bán lẻ tối ưu theo thời gian thực
          </span>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
                <span>{user?.fullName || user?.username}</span>
                {user?.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">{user?.email || 'authenticated'}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Đổi mật khẩu"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Change Password Modal (UC-015) */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <KeyRound className="w-5 h-5 text-brand-600" />
            <span>Đổi Mật Khẩu Cá Nhân (UC-015)</span>
          </div>
        }
        description="Vui lòng nhập mật khẩu hiện tại và mật khẩu mới bảo mật."
        size="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {errorMsg && <Alert variant="error">{errorMsg}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Input
            type="password"
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Input
            type="password"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Tối thiểu 6 ký tự"
          />

          <Input
            type="password"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Nhập lại mật khẩu mới"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Cập Nhật Mật Khẩu
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Navbar;
