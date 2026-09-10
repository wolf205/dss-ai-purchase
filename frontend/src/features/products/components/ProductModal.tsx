import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';
import { Product } from '../types/product.types';
import productApi from '../api/productApi';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sữa & Bơ sữa');
  const [unit, setUnit] = useState('Hộp');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [defaultLeadTime, setDefaultLeadTime] = useState<number>(2);
  const [minSafetyStock, setMinSafetyStock] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setUnit(productToEdit.unit);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setDefaultLeadTime(productToEdit.defaultLeadTime);
      setMinSafetyStock(productToEdit.minSafetyStock);
    } else {
      setSku('');
      setName('');
      setCategory('Sữa & Bơ sữa');
      setUnit('Hộp');
      setCostPrice('');
      setSellingPrice('');
      setDefaultLeadTime(2);
      setMinSafetyStock(10);
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || costPrice === '' || sellingPrice === '') {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (Number(costPrice) <= 0 || Number(sellingPrice) <= 0) {
      setErrorMsg('Giá vốn và giá bán phải lớn hơn 0 VNĐ.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (productToEdit) {
        await productApi.updateProduct(productToEdit.sku, {
          name,
          category,
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          defaultLeadTime: Number(defaultLeadTime),
          minSafetyStock: Number(minSafetyStock),
        });
      } else {
        await productApi.createProduct({
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          defaultLeadTime: Number(defaultLeadTime),
          minSafetyStock: Number(minSafetyStock),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Không thể lưu thông tin sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Package className="w-5 h-5 text-brand-600" />
          <span>{productToEdit ? 'Chỉnh Sửa Sản Phẩm (UC-001)' : 'Thêm Mới Sản Phẩm (UC-001)'}</span>
        </div>
      }
      description="Quản lý danh mục sản phẩm và các tham số tồn kho an toàn ban đầu (FR-001, FR-003)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mã SKU"
            placeholder="Ví dụ: MILK-VNM-180"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            disabled={!!productToEdit}
            required
          />

          <Input
            label="Tên Sản Phẩm"
            placeholder="Ví dụ: Sữa tươi Vinamilk..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Ngành Hàng"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <Input
            label="Đơn Vị Tính"
            placeholder="Hộp, Chai, Thùng, Gói..."
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            min="100"
            step="100"
            label="Giá Vốn Mua Vào (VNĐ)"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />

          <Input
            type="number"
            min="100"
            step="100"
            label="Giá Bán Niêm Yết (VNĐ)"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            min="1"
            label="Lead Time Mặc Định (Ngày)"
            value={defaultLeadTime}
            onChange={(e) => setDefaultLeadTime(Number(e.target.value))}
            required
            helperText="Thời gian trung bình hàng về kể từ khi đặt."
          />

          <Input
            type="number"
            min="0"
            label="Tồn An Toàn Tối Thiểu (Min SS)"
            value={minSafetyStock}
            onChange={(e) => setMinSafetyStock(Number(e.target.value))}
            required
            helperText="Ngưỡng sàn chống cạn kiệt tồn kho."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {productToEdit ? 'Lưu Cập Nhật' : 'Thêm Sản Phẩm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
