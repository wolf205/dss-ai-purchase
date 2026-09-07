import apiClient from '../../../lib/axios';
import { ImportResultData, ImportType } from '../types/ingestion.types';

export const ingestionApi = {
  uploadFile: async (
    file: File,
    type: ImportType,
    overwriteDuplicateDates: boolean = true
  ): Promise<ImportResultData> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('overwriteDuplicateDates', String(overwriteDuplicateDates));

    const res = await apiClient.post<{ success: boolean; data: ImportResultData }>(
      '/data-import/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  downloadTemplate: (type: ImportType) => {
    let csvContent = '';
    let filename = '';

    if (type === 'SALES_HISTORY') {
      csvContent = 'SKU,Date,QuantitySold,UnitPrice\n' +
        'MILK-VNM-180,2026-09-01,24,6200\n' +
        'BEER-TIGER-330,2026-09-01,48,16000\n' +
        'NOODLE-HAOHAO-75,2026-09-01,60,4500\n';
      filename = 'Template_LichSuBanHang.csv';
    } else {
      csvContent = 'SKU,OnHand\n' +
        'MILK-VNM-180,120\n' +
        'BEER-TIGER-330,85\n' +
        'NOODLE-HAOHAO-75,200\n';
      filename = 'Template_KiemKeTonKho.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export default ingestionApi;
