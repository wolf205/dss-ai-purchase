import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, RefreshCw, Edit3, Phone, Mail } from 'lucide-react';
import supplierApi from '../api/supplierApi';
import { Supplier } from '../types/supplier.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Alert from '../../../components/ui/Toast';
import { useAuth } from '../../auth/hooks/useAuth';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierApi.getSuppliers({ search: search.trim() || undefined });
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setCode('');
    setName('');
    setPhone('');
    setEmail('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setCode(sup.code);
    setName(sup.name);
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!editingSupplier && !code.trim())) {
      setFormError('Vui lòng điền mã và tên nhà cung cấp.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      if (editingSupplier) {
        await supplierApi.updateSupplier(editingSupplier.id, { name, phone, email });
      } else {
        await supplierApi.createSupplier({ code: code.trim(), name: name.trim(), phone, email, statusTag: 'ACTIVE' });
      }
      setShowModal(false);
      await fetchSuppliers();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Không thể lưu thông tin nhà cung cấp.');
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
            <Truck className="w-7 h-7 text-brand-600" />
            Danh Mục Nhà Cung Cấp (UC-002)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách đối tác cung ứng, thông tin liên hệ và số lượng SKU phân phối (FR-002)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchSuppliers}
            disabled={loading}
          >
            Làm Mới
          </Button>

          {isAdmin && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
              Thêm Nhà Cung Cấp
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSuppliers();
          }}
          className="flex-1 max-w-md flex items-center gap-2"
        >
          <Input
            placeholder="Tìm theo mã hoặc tên nhà cung cấp..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Tìm
          </Button>
        </form>
      </div>

      {/* Table */}
      <Table isLoading={loading} isEmpty={suppliers.length === 0} colSpan={6}>
        <TableHeader>
          <TableRow>
            <TableHead>Mã NCC</TableHead>
            <TableHead>Tên Nhà Cung Cấp</TableHead>
            <TableHead>Số Điện Thoại</TableHead>
            <TableHead>Email Liên Hệ</TableHead>
            <TableHead className="text-center">Số SKU Cung Ứng</TableHead>
            {isAdmin && <TableHead className="text-right">Thao Tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((sup) => (
            <TableRow key={sup.id}>
              <TableCell className="font-mono font-bold text-xs text-slate-800">{sup.code}</TableCell>
              <TableCell className="font-semibold text-slate-900">{sup.name}</TableCell>
              <TableCell className="text-xs text-slate-600">
                {sup.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {sup.phone}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {sup.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {sup.email}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-center font-bold text-slate-700">
                {sup.productCount || 0} SKU
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => openEditModal(sup)}
                  >
                    Sửa
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        title={editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Mã Nhà Cung Cấp"
            placeholder="Ví dụ: SUP-VINAMILK"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!editingSupplier}
            required
          />

          <Input
            label="Tên Đầy Đủ Nhà Cung Cấp"
            placeholder="Ví dụ: Công ty Cổ phần Sữa Việt Nam..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Số Điện Thoại"
            placeholder="Ví dụ: 02854155555"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            type="email"
            label="Email Liên Hệ"
            placeholder="contact@supplier.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={formLoading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              {editingSupplier ? 'Lưu Thay Đổi' : 'Tạo Nhà Cung Cấp'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
