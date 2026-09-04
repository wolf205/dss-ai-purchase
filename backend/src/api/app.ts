import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());

  // Health check endpoint (Uniform Envelope)
  app.get('/api/v1/health', async (_req: Request, res: Response) => {
    let dbStatus = 'DISCONNECTED';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'CONNECTED';
    } catch {
      dbStatus = 'ERROR';
    }

    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: 'dss-backend',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint không tồn tại hoặc chưa được hỗ trợ.',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
