import { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../domain/exceptions/DomainException';
import { ValidationException } from '../../domain/exceptions/ValidationException';
import { InvalidWeightDistributionException } from '../../domain/exceptions/InvalidWeightDistributionException';

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('[API Error]:', err);

  if (err instanceof InvalidWeightDistributionException) {
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof ValidationException) {
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof DomainException) {
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle generic unexpected errors
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Đã xảy ra lỗi hệ thống không mong muốn',
    },
    timestamp: new Date().toISOString(),
  });
};
