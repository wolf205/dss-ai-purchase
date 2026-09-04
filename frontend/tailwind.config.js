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
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
        // Bảng màu 5 cấp độ rủi ro tồn kho chuẩn (BR-002)
        risk: {
          'out-of-stock': '#991B1B', // Đỏ sẫm - Hết hàng
          'critical': '#EA580C',     // Cam đỏ - Nguy cấp
          'warning': '#D97706',      // Vàng cam - Cần đặt
          'healthy': '#16A34A',      // Xanh lá - An toàn
          'overstock': '#7C3AED',    // Tím - Tồn dư quá mức
        },
      },
    },
  },
  plugins: [],
}
