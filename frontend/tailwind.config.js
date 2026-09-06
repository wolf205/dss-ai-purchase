/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
        // Bảng màu 5 cấp độ rủi ro tồn kho chuẩn (BR-002) + Dead stock
        risk: {
          'out-of-stock': '#991B1B',
          'out_of_stock': '#991B1B',
          'critical': '#EA580C',
          'warning': '#D97706',
          'healthy': '#16A34A',
          'normal': '#16A34A',
          'overstock': '#7C3AED',
          'dead-stock': '#64748B',
          'dead_stock': '#64748B',
        },
      },
    },
  },
  plugins: [],
}
