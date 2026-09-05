import dotenv from 'dotenv';
import { app } from './app';
import { prisma } from '../infrastructure/database/prisma';

dotenv.config();

const port = process.env.PORT || 5000;

// Start Express Server
const server = app.listen(port, () => {
  console.log(`[DSS AI Purchase Backend] Service running on http://localhost:${port}`);
  console.log(`[Health Check] http://localhost:${port}/health`);
  console.log(`[API Base] http://localhost:${port}/api/v1`);
});

// Graceful Shutdown Handler
const handleShutdown = async (signal: string) => {
  console.log(`\n[Server] Nhận tín hiệu ${signal}. Đang đóng kết nối an toàn...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[Server] Đã ngắt kết nối CSDL. Tiến trình kết thúc an toàn.');
    } catch (err) {
      console.error('[Server] Lỗi khi ngắt kết nối CSDL:', err);
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
