import React, { useState, useEffect } from 'react';
import { Grid, RefreshCw, Info } from 'lucide-react';
import AbcXyzMatrixChart, { MatrixCellData } from '../../../components/charts/AbcXyzMatrixChart';
import InventoryTable from '../components/InventoryTable';
import SkuDetail360Modal from '../components/SkuDetail360Modal';
import Button from '../../../components/ui/Button';
import inventoryApi from '../api/inventoryApi';
import { InventoryItem } from '../types/inventory.types';

export const AbcXyzMatrixPage: React.FC = () => {
  const [matrixData, setMatrixData] = useState<Record<string, MatrixCellData>>({});
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [activeSku360, setActiveSku360] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mat, itms] = await Promise.all([
        inventoryApi.getAbcXyzMatrix(),
        inventoryApi.getItems(),
      ]);
      setMatrixData(mat);
      setItems(itms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Grid className="w-7 h-7 text-brand-600" />
            Phân Tích Ma Trận 9 Ô ABC - XYZ (UC-005)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phân bổ danh mục sản phẩm theo quy tắc Pareto 80/20 và hệ số biến thiên ổn định tiêu thụ CV (BR-009, BR-010)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchData}
          disabled={loading}
        >
          Làm Mới Ma Trận
        </Button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Hướng dẫn tương tác:</strong> Nhấp chuột vào bất kỳ ô nào trong 9 ô bên dưới (ví dụ <strong>AX</strong>: Mặt hàng chủ lực ổn định, hoặc <strong>CZ</strong>: Mặt hàng phụ biến động cao) để lọc danh sách sản phẩm tương ứng và xem chi tiết.
        </div>
      </div>

      {/* 9-cell Matrix Chart Component */}
      <AbcXyzMatrixChart
        data={matrixData}
        selectedSegment={selectedSegment}
        onSelectSegment={(seg) => setSelectedSegment(seg)}
      />

      {/* Filtered Products Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Danh Sách Sản Phẩm Thuộc Phân Nhóm{' '}
            {selectedSegment ? (
              <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-extrabold text-xs">
                {selectedSegment}
              </span>
            ) : (
              <span className="text-slate-500 font-normal">(Toàn bộ 9 ô)</span>
            )}
          </h3>
        </div>

        <InventoryTable
          items={items}
          isLoading={loading}
          onSelectSku360={(sku) => setActiveSku360(sku)}
        />
      </div>

      {/* Sku 360 Detail Modal */}
      <SkuDetail360Modal
        sku={activeSku360}
        isOpen={!!activeSku360}
        onClose={() => setActiveSku360(null)}
      />
    </div>
  );
};

export default AbcXyzMatrixPage;
