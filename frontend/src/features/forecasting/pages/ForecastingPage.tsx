import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, RefreshCw, Cpu, AlertTriangle, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import TimeSeriesForecastChart, { ForecastPoint } from '../../../components/charts/TimeSeriesForecastChart';
import ColdStartModal from '../components/ColdStartModal';
import Button from '../../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import forecastApi from '../api/forecastApi';
import { ForecastSummaryItem } from '../types/forecast.types';
import { cn } from '../../../lib/utils';

export const ForecastingPage: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(14);
  const [forecasts, setForecasts] = useState<ForecastSummaryItem[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [points, setPoints] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showColdStartModal, setShowColdStartModal] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await forecastApi.getForecasts({ horizon });
      setForecasts(data || []);
      if (data && data.length > 0) {
        setSelectedSku((prev) => (data.some((f) => f.sku === prev) ? prev : data[0].sku));
      } else {
        setSelectedSku('');
        setPoints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChartPoints = async (sku: string, h: number) => {
    if (!sku) {
      setPoints([]);
      return;
    }
    setChartLoading(true);
    try {
      const pts = await forecastApi.getSkuForecastPoints(sku, h);
      setPoints(pts);
    } finally {
      setChartLoading(false);
    }
  };

  const handleRunForecast = async (targetHorizon?: number) => {
    setGenerating(true);
    setAlertInfo(null);
    try {
      const res = await forecastApi.generateForecasts({ horizonDays: targetHorizon });
      setAlertInfo({
        type: 'success',
        message: res.message || `Đã hoàn tất tính toán dự báo AI cho ${res.skusAnalyzed} SKU!`,
      });
      await fetchSummary();
      if (selectedSku) {
        await fetchChartPoints(selectedSku, targetHorizon || horizon);
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: 'Lỗi khi kích hoạt tính toán dự báo AI. Vui lòng kiểm tra lại dịch vụ AI Service.',
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [horizon]);

  useEffect(() => {
    if (selectedSku) {
      fetchChartPoints(selectedSku, horizon);
    } else {
      setPoints([]);
    }
  }, [selectedSku, horizon]);

  const selectedItem = forecasts.find((f) => f.sku === selectedSku);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-brand-600" />
            Dự Báo Nhu Cầu Bán Hàng AI (UC-007)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thuật toán chuỗi thời gian Holt-Winters & Cơ chế Fallback SMA-7 tự động khi sai số WAPE &gt; 40% (BR-006, BR-007)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selector (7, 14, 30 days) */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-xs">
            {[7, 14, 30].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  horizon === h
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {h} Ngày
              </button>
            ))}
          </div>

          {/* NÚT CHẠY DỰ BÁO AI NỔI BẬT */}
          <Button
            variant="primary"
            size="sm"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
            leftIcon={<Sparkles className={`w-3.5 h-3.5 text-amber-300 ${generating ? 'animate-spin' : ''}`} />}
            onClick={() => handleRunForecast(horizon)}
            isLoading={generating}
          >
            Chạy Dự Báo {horizon}N
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Play className="w-3.5 h-3.5 text-slate-600" />}
            onClick={() => handleRunForecast(0)}
            disabled={generating}
            title="Chạy mô hình Holt-Winters cho cả 3 chu kỳ 7, 14, 30 ngày"
          >
            Chạy Toàn Bộ (7, 14, 30N)
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => setShowColdStartModal(true)}
          >
            Nhập Cold Start (UC-008)
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              fetchSummary();
              if (selectedSku) fetchChartPoints(selectedSku, horizon);
            }}
            disabled={loading}
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {alertInfo && (
        <div
          className={cn(
            'p-4 rounded-xl border text-xs flex items-center justify-between shadow-xs transition-all',
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          )}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{alertInfo.message}</span>
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Forecast Chart with Confidence Band */}
      {selectedSku && selectedItem ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{selectedItem?.name || selectedSku}</span>
                <span className="text-xs font-mono text-slate-400">({selectedSku})</span>
                {selectedItem?.isFallback ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <AlertTriangle className="w-3 h-3" /> Fallback SMA-7 (BR-007)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                    <Cpu className="w-3 h-3 text-indigo-600" /> Mô Hình AI Holt-Winters
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Biểu đồ trực quan hóa dữ liệu bán thực tế 14 ngày quá khứ và dải tin cậy 95% trong {horizon} ngày tới (FR-014)
              </p>
            </div>

            {selectedItem && (
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Tổng Cầu Dự Báo</div>
                  <div className="text-xl font-black text-brand-600">
                    {selectedItem.forecastedDemand} <span className="text-xs font-normal text-slate-500">đơn vị</span>
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <div className="text-xs text-slate-400 font-medium">Sai Số WAPE</div>
                  <div className={cn('text-xl font-black', selectedItem.wape != null && selectedItem.wape > 40 ? 'text-rose-600' : 'text-emerald-600')}>
                    {selectedItem.wape != null ? `${selectedItem.wape.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            {chartLoading ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500 mb-2" />
                Đang tính toán biểu đồ dự báo...
              </div>
            ) : (
              <TimeSeriesForecastChart
                data={points}
                sku={selectedSku}
                productName={selectedItem?.name}
                algorithmName={selectedItem?.algorithmUsed || 'AI Holt-Winters'}
                isFallback={selectedItem?.isFallback}
                wape={selectedItem?.wape}
                showTitle={false}
                height="400px"
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty State Đột Phá Có Nút Kích Hoạt Dự Báo Ngay Tại Chỗ */
        <div className="bg-gradient-to-b from-slate-50/70 to-white rounded-2xl border-2 border-dashed border-slate-200 p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-xs">
            <Cpu className="w-7 h-7 text-brand-600 animate-pulse" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h4 className="text-lg font-black text-slate-800">
              Chưa Có Dữ Liệu Dự Báo Cho Chu Kỳ {horizon} Ngày
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mô hình AI chuỗi thời gian Holt-Winters & dải tin cậy 95% chưa được tính toán cho khung thời gian {horizon} ngày. 
              Hãy kích hoạt tính toán ngay để phân tích xu hướng bán hàng của toàn bộ sản phẩm.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 shadow-sm"
              leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              onClick={() => handleRunForecast(horizon)}
              isLoading={generating}
            >
              ⚡ Kích Hoạt Dự Báo AI {horizon} Ngày Ngay
            </Button>
            <Button
              variant="outline"
              size="md"
              className="font-semibold text-slate-700"
              onClick={() => handleRunForecast(0)}
              disabled={generating}
            >
              Chạy Dự Báo Toàn Bộ (7, 14, 30 Ngày)
            </Button>
          </div>
        </div>
      )}

      {/* Summary Table across SKUs */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">
          Tổng Hợp Dự Báo Nhu Cầu Theo Danh Mục ({forecasts.length} SKU)
        </h3>

        <Table isLoading={loading} isEmpty={forecasts.length === 0} colSpan={7}>
          <TableHeader>
            <TableRow>
              <TableHead>Mã SKU</TableHead>
              <TableHead>Tên Sản Phẩm</TableHead>
              <TableHead className="text-right">Dự Báo {horizon} Ngày</TableHead>
              <TableHead className="text-right">TB Bán / Ngày</TableHead>
              <TableHead className="text-right">Sai Số WAPE</TableHead>
              <TableHead className="text-center">Thuật Toán Sử Dụng</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecasts.map((item) => (
              <TableRow
                key={item.sku}
                className={selectedSku === item.sku ? 'bg-brand-50/60 font-medium' : ''}
              >
                <TableCell className="font-mono text-xs font-bold text-slate-800">
                  {item.sku}
                </TableCell>
                <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                <TableCell className="text-right font-black text-slate-900">
                  {item.forecastedDemand}
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {item.dailyAvgDemand != null ? item.dailyAvgDemand.toFixed(1) : '0.0'} / ngày
                </TableCell>
                <TableCell className="text-right">
                  {item.wape != null ? (
                    <span
                      className={cn(
                        'font-bold text-xs px-2 py-0.5 rounded-full',
                        item.wape > 40
                          ? 'bg-red-100 text-red-700'
                          : item.wape > 20
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      )}
                    >
                      {item.wape.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.isFallback ? (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      SMA-7 Fallback
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      Holt-Winters
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={selectedSku === item.sku ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSku(item.sku)}
                  >
                    {selectedSku === item.sku ? 'Đang Xem' : 'Xem Biểu Đồ'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cold Start Modal */}
      <ColdStartModal
        isOpen={showColdStartModal}
        onClose={() => setShowColdStartModal(false)}
        onSuccess={fetchSummary}
      />
    </div>
  );
};

export default ForecastingPage;
