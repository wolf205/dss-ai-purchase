import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, RefreshCw } from 'lucide-react';
import supplierApi from '../api/supplierApi';
import { SupplierEvaluation } from '../types/supplier.types';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';

export const SupplierEvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await supplierApi.getEvaluations();
      setEvaluations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-brand-600" />
            Bảng Xếp Hạng & Đánh Giá Nhà Cung Cấp (UC-009)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp 4 tiêu chí hiệu suất: Đơn giá (Price), Đúng hạn (OTIF), Chất lượng (Quality), Thời gian giao (Lead time) (FR-019, FR-020)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchEvaluations}
          disabled={loading}
        >
          Tính Lại Bảng Điểm
        </Button>
      </div>

      {/* Evaluation Explanation Alert */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3 shadow-md">
        <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white text-sm">
            Nguyên Tắc Chấm Điểm 4 Thành Phần & Gợi Ý Đối Tác Tự Động
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Hệ thống DSS tự động lựa chọn nhà cung cấp có điểm tổng hợp cao nhất để xuất hiện trên danh sách Khuyến Nghị Mua Hàng (UC-010). Điểm tổng được tính lũy kế dựa trên lịch sử các lần nhận hàng thực tế kho (UC-014) theo bộ 4 trọng số do Quản trị viên thiết lập (BR-013).
          </p>
        </div>
      </div>

      {/* Rankings Table */}
      <Table isLoading={loading} isEmpty={evaluations.length === 0} colSpan={8}>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-16">Hạng</TableHead>
            <TableHead>Nhà Cung Cấp</TableHead>
            <TableHead className="text-center">Số Lần Giao Phân Tích</TableHead>
            <TableHead className="text-right">Điểm Giá (Price)</TableHead>
            <TableHead className="text-right">Điểm OTIF</TableHead>
            <TableHead className="text-right">Điểm Chất Lượng</TableHead>
            <TableHead className="text-right">Điểm Lead Time</TableHead>
            <TableHead className="text-right font-black text-brand-700">Tổng Điểm DSS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((item) => (
            <TableRow key={item.supplierId} className={item.rank === 1 ? 'bg-amber-50/50 font-medium' : ''}>
              <TableCell className="text-center">
                {item.rank === 1 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs shadow-xs">
                    🥇 1
                  </span>
                ) : item.rank === 2 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-bold text-xs">
                    🥈 2
                  </span>
                ) : item.rank === 3 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-800 text-white font-bold text-xs">
                    🥉 3
                  </span>
                ) : (
                  <span className="font-bold text-slate-500">#{item.rank}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="font-bold text-slate-900">{item.supplierName}</div>
                <div className="font-mono text-[11px] text-slate-400">{item.supplierCode}</div>
              </TableCell>
              <TableCell className="text-center font-bold text-slate-600">
                {item.deliveryCountAnalyzed} lần
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-700">
                {item.scores.priceScore.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-semibold text-emerald-600">
                {item.scores.otifScore.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-semibold text-indigo-600">
                {item.scores.qualityScore.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-700">
                {item.scores.leadTimeScore.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex px-3 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 font-black text-sm shadow-xs">
                  {item.totalScore.toFixed(1)} / 100
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SupplierEvaluationsPage;
