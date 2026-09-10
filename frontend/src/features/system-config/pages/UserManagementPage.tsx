import React, { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw, Shield, UserCheck, Power } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { User, UserRole } from '../../auth/types/auth.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Alert from '../../../components/ui/Toast';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: User[] }>('/users');
      setUsers(res.data.data);
    } catch {
      // Fallback demo users
      setUsers([
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          username: 'admin',
          fullName: 'Quản Trị Viên Hệ Thống',
          email: 'admin@dss-purchase.local',
          role: 'ADMIN',
          isActive: true,
          createdAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'a0000000-0000-0000-0000-000000000002',
          username: 'staff01',
          fullName: 'Nguyễn Văn A (Nhân Viên Mua Hàng)',
          email: 'staff01@dss-purchase.local',
          role: 'STAFF',
          isActive: true,
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    if (user.username === 'admin') {
      alert('Không thể vô hiệu hóa tài khoản quản trị viên gốc (Superadmin).');
      return;
    }
    const nextStatus = !user.isActive;
    if (confirm(`Xác nhận ${nextStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.username}?`)) {
      try {
        await apiClient.patch(`/users/${user.id}/status`, { isActive: nextStatus });
        await fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Không thể cập nhật trạng thái người dùng.');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim() || !email.trim()) {
      setFormError('Vui lòng điền đầy đủ các trường thông tin.');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      setFormError('Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang hoặc dấu chấm (không chứa khoảng trắng).');
      return;
    }

    if (password.length < 8) {
      setFormError('Mật khẩu khởi tạo phải có tối thiểu 8 ký tự.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await apiClient.post('/users', { username, password, fullName, email, role });
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setRole('STAFF');
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Không thể tạo tài khoản mới.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-600" />
            Quản Lý Tài Khoản & Phân Quyền (UC-016)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị danh sách người dùng, gán vai trò RBAC (Admin/Staff) và kiểm soát trạng thái kích hoạt (FR-032, FR-033)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Làm Mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Tạo Tài Khoản Mới
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Table isLoading={loading} isEmpty={users.length === 0} colSpan={6}>
        <TableHeader>
          <TableRow>
            <TableHead>Tên Đăng Nhập</TableHead>
            <TableHead>Họ & Tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Vai Trò (Role)</TableHead>
            <TableHead className="text-center">Trạng Thái</TableHead>
            <TableHead className="text-right">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className={!u.isActive ? 'opacity-60 bg-slate-50' : ''}>
              <TableCell className="font-mono font-bold text-xs text-slate-800">
                {u.username}
              </TableCell>
              <TableCell className="font-semibold text-slate-900">{u.fullName}</TableCell>
              <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
              <TableCell className="text-center">
                {u.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                    <Shield className="w-3.5 h-3.5" /> Quản Trị Viên (Admin)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                    <UserCheck className="w-3.5 h-3.5" /> Nhân Viên (Staff)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {u.isActive ? (
                  <span className="text-xs font-semibold text-emerald-600">Hoạt động</span>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">Đã khóa</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {u.username !== 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={u.isActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600'}
                    leftIcon={<Power className="w-3.5 h-3.5" />}
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? 'Khóa Tài Khoản' : 'Mở Khóa'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="md"
        title="Tạo Tài Khoản Người Dùng Mới"
        description="Người dùng mới sẽ được cấp quyền truy cập theo vai trò được gán."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Tên Đăng Nhập"
            placeholder="Ví dụ: staff_kho"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Họ & Tên Đầy Đủ"
            placeholder="Ví dụ: Trần Thị B"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="Email"
            placeholder="tranthib@dss-purchase.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Mật Khẩu Khởi Tạo"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Phân Quyền Vai Trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="STAFF">Nhân Viên Mua Hàng (STAFF)</option>
              <option value="ADMIN">Quản Trị Viên Hệ Thống (ADMIN)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={formLoading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              Tạo Tài Khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
