import React from 'react';
import ReactECharts from 'echarts-for-react';

export interface ForecastPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  lowerBound?: number | null;
  upperBound?: number | null;
}

export interface TimeSeriesForecastChartProps {
  data: ForecastPoint[];
  title?: string;
  sku?: string;
  productName?: string;
  algorithmName?: string;
  isFallback?: boolean;
  wape?: number;
  height?: string;
}

export const TimeSeriesForecastChart: React.FC<TimeSeriesForecastChartProps> = ({
  data,
  title,
  sku,
  productName,
  algorithmName,
  isFallback = false,
  wape,
  height = '400px',
}) => {
  const dates = data.map((d) => d.date);
  const actualSeries = data.map((d) => (d.actual !== undefined ? d.actual : null));
  const forecastSeries = data.map((d) => (d.forecast !== undefined ? d.forecast : null));
  const lowerSeries = data.map((d) => (d.lowerBound !== undefined ? d.lowerBound : null));
  const bandSeries = data.map((d) => {
    if (d.upperBound !== undefined && d.lowerBound !== undefined && d.upperBound !== null && d.lowerBound !== null) {
      return Math.max(0, d.upperBound - d.lowerBound);
    }
    return null;
  });

  const option = {
    title: {
      text: title || (productName ? `Dự báo nhu cầu: ${productName} (${sku})` : 'Chuỗi thời gian bán hàng & Dự báo AI'),
      subtext: algorithmName
        ? `Thuật toán: ${algorithmName} ${isFallback ? '(Chế độ Fallback dự phòng)' : ''} ${wape !== undefined ? `• Sai số WAPE: ${wape.toFixed(1)}%` : ''}`
        : undefined,
      left: 'left',
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
      subtextStyle: { fontSize: 11, color: isFallback ? '#dc2626' : '#64748b' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#0f172a', fontSize: 12 },
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: '#475569' },
      },
    },
    legend: {
      data: ['Thực tế quá khứ', 'Dự báo tương lai', 'Dải tin cậy 95%'],
      top: 'bottom',
      icon: 'roundRect',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: title ? '16%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'Số lượng (Đơn vị)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    series: [
      // 1. Thực tế bán hàng quá khứ
      {
        name: 'Thực tế quá khứ',
        type: 'line',
        data: actualSeries,
        itemStyle: { color: '#0284c7' },
        lineStyle: { width: 2.5 },
        symbol: 'circle',
        symbolSize: 4,
        connectNulls: false,
      },
      // 2. Cận dưới dải tin cậy (trong suốt, làm nền stack)
      {
        name: 'Dải tin cậy 95%',
        type: 'line',
        data: lowerSeries,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
      },
      // 3. Vùng mây che phủ giữa cận dưới và cận trên
      {
        name: 'Khoảng biến động',
        type: 'line',
        data: bandSeries,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: isFallback ? 'rgba(217, 119, 6, 0.18)' : 'rgba(234, 88, 12, 0.18)',
        },
        stack: 'confidence-band',
        symbol: 'none',
      },
      // 4. Đường dự báo tương lai
      {
        name: 'Dự báo tương lai',
        type: 'line',
        data: forecastSeries,
        itemStyle: { color: isFallback ? '#d97706' : '#ea580c' },
        lineStyle: { width: 2.5, type: 'dashed' },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};

export default TimeSeriesForecastChart;
