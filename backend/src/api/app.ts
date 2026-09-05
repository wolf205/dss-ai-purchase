import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import apiRoutes from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

/**
 * Creates and configures the Express application instance.
 * Pure application definition without network listener for testability and portability.
 */
export function createApp(): Express {
  const app = express();

  // 1. Security and parsing middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 2. Health check endpoint (NFR-04 & Docker Healthcheck)
  app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: 'dss-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Mount API v1 Routes
  app.use('/api/v1', apiRoutes);

  // 4. Global 404 Handler for unmatched endpoints
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

  // 5. Global Error Handler Middleware
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
export default app;
