import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { InventoryItem } from '../types/inventory.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge, { RiskLevel } from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import { formatDaysOfSupply } from '../../../lib/formatters';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  selectedRisk?: RiskLevel | string | null;
  selectedSegment?: string | null;
  onSelectSku360: (sku: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading = false,
  selectedRisk,
  selectedSegment,
  onSelectSku360,
}) => {
  const [search, setSearch] = useState('');
  const [filterDeadStock, setFilterDeadStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredItems = items.filter((item) => {
    if (selectedRisk && item.riskLevel !== selectedRisk) {
      return false;
    }
    if (selectedSegment && item.abcXyzSegment !== selectedSegment) {
      return false;
    }
    if (filterDeadStock && !item.isDeadStock) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Tìm theo tên sản phẩm, mã SKU, ngành hàng..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={filterDeadStock}
              onChange={(e) => setFilterDeadStock(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Chỉ xem hàng bất động (Dead Stock)</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <Table isLoading={isLoading} isEmpty={filteredItems.length === 0} colSpan={11}>
        <TableHeader>
          <TableRow>
            <TableHead>Mã SKU</TableHead>
            <TableHead>Tên Sản Phẩm</TableHead>
            <TableHead>Ngành Hàng</TableHead>
            <TableHead className="text-center">Phân Nhóm</TableHead>
            <TableHead className="text-right">Tồn Khả Dụng (On-Hand)</TableHead>
            <TableHead className="text-right">Chờ Về (On-Order)</TableHead>
            <TableHead className="text-right">Vị Trí Tồn (IP)</TableHead>
            <TableHead className="text-right">Tồn An Toàn (SS)</TableHead>
            <TableHead className="text-right">Điểm Đặt (ROP)</TableHead>
            <TableHead className="text-center">Số Ngày Bán (DoS)</TableHead>
            <TableHead className="text-center">Mức Rủi Ro (BR-002)</TableHead>
            <TableHead className="text-right">Hành Động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((item) => (
            <TableRow key={item.sku}>
              <TableCell className="font-mono font-bold text-xs text-slate-800">
                {item.sku}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-slate-900 line-clamp-1">{item.name}</div>
                {item.unit && <span className="text-[11px] text-slate-400">ĐVT: {item.unit}</span>}
              </TableCell>
              <TableCell className="text-xs text-slate-600">{item.category}</TableCell>
              <TableCell className="text-center">
                {item.abcXyzSegment ? (
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.abcXyzSegment}
                  </span>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-800">{item.onHand}</TableCell>
              <TableCell className="text-right text-sky-700 font-medium">
                {item.onOrder > 0 ? `+${item.onOrder}` : '0'}
              </TableCell>
              <TableCell className="text-right font-black text-slate-900">
                {item.inventoryPosition}
              </TableCell>
              <TableCell className="text-right text-slate-500">{item.safetyStock}</TableCell>
              <TableCell className="text-right font-semibold text-amber-800">
                {item.reorderPoint}
              </TableCell>
              <TableCell className="text-center font-bold text-xs">
                {formatDaysOfSupply(item.daysOfSupply)}
              </TableCell>
              <TableCell className="text-center">
                <Badge riskLevel={item.riskLevel} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => onSelectSku360(item.sku)}
                  title="Xem toàn cảnh 360°"
                >
                  360°
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default InventoryTable;
