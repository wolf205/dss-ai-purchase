import { createApp, prisma } from './app';

const PORT = process.env.PORT || 5000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`🚀 DSS Backend Service is listening on port ${PORT}`);
  console.log(`📡 Healthcheck available at: http://localhost:${PORT}/api/v1/health`);
});

const shutdown = async () => {
  console.log('Stopping server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Server stopped.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
