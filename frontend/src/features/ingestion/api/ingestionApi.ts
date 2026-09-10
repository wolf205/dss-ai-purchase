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

  downloadTemplate: async (type: ImportType, format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> => {
    const res = await apiClient.get(`/data-import/templates/${type}`, {
      params: { format },
      responseType: 'blob',
    });

    let filename = `Mau_Nhap_Lieu_${type}.${format}`;
    const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const mimeType =
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv;charset=utf-8;';

    const blob = new Blob([res.data], { type: mimeType });
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
