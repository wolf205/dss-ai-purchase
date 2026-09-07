import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, FileText, Download, AlertCircle } from 'lucide-react';
import ingestionApi from '../api/ingestionApi';
import { ImportResultData, ImportType, ImportErrorDetail } from '../types/ingestion.types';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Toast';
import { cn } from '../../../lib/utils';

export const DataImportPage: React.FC = () => {
  const [importType, setImportType] = useState<ImportType>('SALES_HISTORY');
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ImportErrorDetail[]>([]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setErrorMsg(null);
      setErrorDetails([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
      setErrorDetails([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Vui lòng chọn tệp tin Excel (.xlsx) hoặc CSV (.csv).');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setErrorDetails([]);
    setResult(null);

    try {
      const res = await ingestionApi.uploadFile(file, importType, overwrite);
      setResult(res);
      setFile(null);
      setErrorMsg(null);
      setErrorDetails([]);
    } catch (err: any) {
      const backendError = err.response?.data?.error;
      setErrorMsg(backendError?.message || 'Không thể nạp tệp dữ liệu. Vui lòng kiểm tra định dạng tệp.');
      setErrorDetails(backendError?.details || []);
      setResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <UploadCloud className="w-7 h-7 text-brand-600" />
          Nạp Dữ Liệu Bán Hàng & Tồn Kho (UC-003)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Nhập tệp dữ liệu lịch sử tiêu thụ hoặc số liệu kiểm kê kho thực tế qua định dạng Excel (.xlsx) hoặc CSV (FR-004, FR-006)
        </p>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Upload Form (2 cols) */}
        <div className="md:col-span-2 space-y-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Step 1: Select Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Chọn Loại Dữ Liệu Cần Nạp
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportType('SALES_HISTORY')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all flex items-start gap-3 select-none',
                  importType === 'SALES_HISTORY'
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <FileSpreadsheet className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Lịch Sử Bán Hàng Hàng Ngày</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Các cột: SKU, Date, QuantitySold (Cung cấp dữ liệu học cho AI dự báo)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportType('INVENTORY_SNAPSHOT')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all flex items-start gap-3 select-none',
                  importType === 'INVENTORY_SNAPSHOT'
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Kiểm Kê Tồn Kho Thực Tế</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Các cột: SKU, OnHand, SnapshotDate (Đồng bộ số liệu kiểm kê thực tế)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Drag & Drop Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Kéo Thả Hoặc Chọn Tệp Tin (.XLSX, .CSV - Tối đa 10MB)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-brand-50/20 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="p-3 rounded-full bg-brand-100 text-brand-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Kéo thả tệp tin vào đây hoặc bấm để duyệt file'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Định dạng hỗ trợ: Microsoft Excel (.xlsx) hoặc Comma-Separated Values (.csv)'}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Options & Submit */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>Tự động ghi đè bản ghi nếu trùng ngày (Overwrite duplicate dates)</span>
            </label>

            <Button
              variant="primary"
              size="md"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!file}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Bắt Đầu Nạp Tệp
            </Button>
          </div>
        </div>

        {/* Right: Guide & Template Download (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-400" />
              Quy Chuẩn Cấu Trúc File
            </h3>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Để đảm bảo thuật toán AI và tính toán ROP không bị gián đoạn, tệp dữ liệu cần tuân thủ các quy tắc hợp lệ (BR-005):
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Mã SKU phải tồn tại trong Danh mục sản phẩm.</li>
                <li>Định dạng ngày chuẩn ISO: <code>YYYY-MM-DD</code>.</li>
                <li>Số lượng bán hoặc tồn kho không được âm (&gt;= 0).</li>
                <li>Không chứa các dòng trống hoặc sai định dạng số.</li>
              </ul>
            </div>
            {/* Template download buttons */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Tải Tệp Tin Mẫu (Templates):
              </div>
              <button
                type="button"
                onClick={() => ingestionApi.downloadTemplate('SALES_HISTORY')}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-brand-300 font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-brand-400" />
                  Mẫu Lịch Sử Bán Hàng (.csv)
                </span>
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => ingestionApi.downloadTemplate('INVENTORY_SNAPSHOT')}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-emerald-300 font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Mẫu Kiểm Kê Tồn Kho (.csv)
                </span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3 animate-scale-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Nạp Dữ Liệu Thành Công</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>Tệp: <strong>{result.fileName}</strong></div>
                <div>Tổng số dòng: <strong>{result.totalRows} dòng</strong></div>
                <div className="text-emerald-700 font-bold">Thành công: {result.successfulRows} dòng</div>
                {result.failedRows > 0 && (
                  <div className="text-rose-600 font-bold">Lỗi: {result.failedRows} dòng</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Details Table (UC-003 E2) */}
      {errorDetails.length > 0 && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Chi Tiết Lỗi Dữ Liệu ({errorDetails.length} dòng vi phạm quy tắc)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Quy tắc giao dịch All-or-Nothing</span>
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-rose-50 text-rose-900 font-bold sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center w-16">Dòng</th>
                  <th className="px-3 py-2 text-left w-36">Cột / Trường</th>
                  <th className="px-3 py-2 text-left w-40">Giá Trị Nhập</th>
                  <th className="px-3 py-2 text-left">Nguyên Nhân Vi Phạm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {errorDetails.map((err, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-center font-bold font-mono text-rose-600">{err.row}</td>
                    <td className="px-3 py-2 font-mono text-slate-800 font-bold">{err.field}</td>
                    <td className="px-3 py-2 font-mono text-slate-500 max-w-xs truncate">{String(err.value ?? '-')}</td>
                    <td className="px-3 py-2 text-rose-700 font-medium">{err.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Toàn bộ tệp tin đã bị từ chối để đảm bảo tính toàn vẹn CSDL (BR-010). Vui lòng chỉnh sửa các dòng trên theo hướng dẫn rồi tiến hành nạp lại.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataImportPage;
