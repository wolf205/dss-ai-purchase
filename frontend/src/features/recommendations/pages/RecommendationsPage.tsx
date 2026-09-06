import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  HelpCircle,
  ShoppingCart,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import recommendationApi from '../api/recommendationApi';
import { RecommendationItem, RunAnalysisResult } from '../types/recommendation.types';
import ExplainableDrawer from '../components/ExplainableDrawer';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Alert from '../../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../../lib/formatters';

export const RecommendationsPage: React.FC = () => {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeExplainItem, setActiveExplainItem] = useState<RecommendationItem | null>(null);
  const [pipelineResult, setPipelineResult] = useState<RunAnalysisResult | null>(null);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await recommendationApi.getRecommendations();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    setRunningPipeline(true);
    setPipelineResult(null);
    try {
      const result = await recommendationApi.runAnalysis();
      setPipelineResult(result);
      await fetchRecommendations();
    } finally {
      setRunningPipeline(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const totalEstimatedCost = selectedItems.reduce((sum, i) => sum + i.estimatedTotalCost, 0);

  const handleBatchCreatePO = () => {
    // Navigate to PO creation with pre-filled items
    navigate('/purchase-orders', {
      state: {
        prefilledItems: selectedItems.map((item) => ({
          sku: item.sku,
          name: item.productName,
          quantity: item.suggestedQuantity,
          unitPrice: item.recommendedSupplier.unitPrice,
          supplierId: item.recommendedSupplier.supplierId,
          supplierName: item.recommendedSupplier.name,
        })),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Khuyến Nghị Mua Hàng Thông Minh (UC-010)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đề xuất số lượng đặt hàng tối ưu (Q_raw làm tròn theo MOQ & Pack Size) kèm gợi ý đối tác uy tín nhất (FR-021 → FR-025)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${runningPipeline ? 'animate-spin' : ''}`} />}
            onClick={handleRunPipeline}
            isLoading={runningPipeline}
          >
            Chạy Lại Phân Tích (UC-011)
          </Button>
        </div>
      </div>

      {/* Pipeline Result Toast / Notice */}
      {pipelineResult && (
        <Alert
          variant="success"
          title={`Hoàn thành phân tích on-demand trong ${pipelineResult.executionTimeMs} ms`}
          onClose={() => setPipelineResult(null)}
        >
          {pipelineResult.message} ({pipelineResult.skusAnalyzed} SKU được quét qua AI & DSS, phát hiện{' '}
          {pipelineResult.recommendationsCount} mặt hàng cần nhập kho).
        </Alert>
      )}

      {/* Action Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-700">
              <ShoppingCart className="w-5 h-5 text-brand-200" />
            </div>
            <div>
              <div className="text-sm font-bold">
                Đã chọn {selectedIds.length} sản phẩm cần đặt
              </div>
              <div className="text-xs text-brand-200">
                Tổng dự toán tiền nhập:{' '}
                <strong className="text-white font-extrabold text-sm">
                  {formatCurrency(totalEstimatedCost)}
                </strong>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleBatchCreatePO}
          >
            Tạo Đơn Mua Hàng (PO)
          </Button>
        </div>
      )}

      {/* Recommendations Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Danh Sách Sản Phẩm Cần Đặt Hàng ({items.length} Khuyến Nghị)
          </h3>
        </div>

        <Table isLoading={loading} isEmpty={items.length === 0} colSpan={9}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {selectedIds.length === items.length && items.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-brand-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead>Sản Phẩm & Mức Rủi Ro</TableHead>
              <TableHead className="text-right">Vị Trí Tồn (IP)</TableHead>
              <TableHead className="text-right">Điểm Đặt (ROP)</TableHead>
              <TableHead className="text-center font-bold text-brand-700">
                SL Đề Xuất (Q_sug)
              </TableHead>
              <TableHead className="text-center">Ngày Đặt Đề Xuất</TableHead>
              <TableHead>Đối Tác Tối Ưu (Điểm ĐG)</TableHead>
              <TableHead className="text-right">Dự Toán Chi Phí</TableHead>
              <TableHead className="text-right">Minh Bạch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TableRow
                  key={item.id}
                  className={isSelected ? 'bg-brand-50/70 font-medium' : ''}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.id)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
                      <Badge riskLevel={item.urgencyLevel} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-800">
                    {item.inventoryPosition}
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-800">
                    {item.reorderPoint}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-sm">
                      {item.suggestedQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium text-xs text-slate-600">
                    {formatDate(item.suggestedOrderDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs">
                      {item.recommendedSupplier.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Điểm: <strong className="text-brand-600">{item.recommendedSupplier.score}</strong> | Giá: {formatCurrency(item.recommendedSupplier.unitPrice)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(item.estimatedTotalCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                      onClick={() => setActiveExplainItem(item)}
                    >
                      Giải Trình
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Explainable Drawer Modal */}
      <ExplainableDrawer
        item={activeExplainItem}
        isOpen={!!activeExplainItem}
        onClose={() => setActiveExplainItem(null)}
      />
    </div>
  );
};

export default RecommendationsPage;
