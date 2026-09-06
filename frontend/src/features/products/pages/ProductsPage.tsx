import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, RefreshCw, Edit3, Power, Check, X } from 'lucide-react';
import productApi from '../api/productApi';
import { Product } from '../types/product.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProductModal from '../components/ProductModal';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatCurrency } from '../../../lib/formatters';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productApi.getProducts({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
        }),
        productApi.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleToggleStatus = async (product: Product) => {
    if (!isAdmin) return;
    const nextStatus = !product.isActive;
    const confirmMsg = nextStatus
      ? `Kích hoạt lại sản phẩm ${product.name}?`
      : `Vô hiệu hóa sản phẩm ${product.name}? (Sản phẩm sẽ bị loại trừ khỏi dự báo AI và khuyến nghị mua hàng theo BR-021)`;

    if (confirm(confirmMsg)) {
      try {
        await productApi.updateProduct(product.sku, { isActive: nextStatus });
        await fetchProducts();
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Không thể cập nhật trạng thái sản phẩm.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-brand-600" />
            Quản Lý Danh Mục Sản Phẩm (UC-001)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh mục Master Data, tham số tồn kho an toàn và ngưỡng Lead time cung ứng (FR-001, FR-003)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchProducts}
            disabled={loading}
          >
            Làm Mới
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
            >
              Thêm Sản Phẩm Mới
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <Input
            placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Tìm
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Tất cả ngành hàng</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <Table isLoading={loading} isEmpty={products.length === 0} colSpan={9}>
        <TableHeader>
          <TableRow>
            <TableHead>Mã SKU</TableHead>
            <TableHead>Tên Sản Phẩm</TableHead>
            <TableHead>Ngành Hàng</TableHead>
            <TableHead className="text-center">ĐVT</TableHead>
            <TableHead className="text-right">Giá Vốn</TableHead>
            <TableHead className="text-right">Giá Bán</TableHead>
            <TableHead className="text-center">Lead Time</TableHead>
            <TableHead className="text-center">Trạng Thái</TableHead>
            {isAdmin && <TableHead className="text-right">Thao Tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.sku} className={!p.isActive ? 'opacity-60 bg-slate-50/50' : ''}>
              <TableCell className="font-mono font-bold text-xs text-slate-800">{p.sku}</TableCell>
              <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
              <TableCell className="text-xs text-slate-600">{p.category}</TableCell>
              <TableCell className="text-center text-xs text-slate-500">{p.unit}</TableCell>
              <TableCell className="text-right font-medium text-slate-700">
                {formatCurrency(p.costPrice)}
              </TableCell>
              <TableCell className="text-right font-bold text-slate-900">
                {formatCurrency(p.sellingPrice)}
              </TableCell>
              <TableCell className="text-center text-xs">{p.defaultLeadTime} ngày</TableCell>
              <TableCell className="text-center">
                {p.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                    <Check className="w-3 h-3" /> Kinh doanh
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-xs font-medium">
                    <X className="w-3 h-3" /> Ngừng bán
                  </span>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setEditingProduct(p);
                        setShowModal(true);
                      }}
                      title="Chỉnh sửa thông tin"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={p.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600'}
                      leftIcon={<Power className="w-3.5 h-3.5" />}
                      onClick={() => handleToggleStatus(p)}
                      title={p.isActive ? 'Ngừng kinh doanh' : 'Kích hoạt lại'}
                    >
                      {p.isActive ? 'Khóa' : 'Mở'}
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productToEdit={editingProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default ProductsPage;
