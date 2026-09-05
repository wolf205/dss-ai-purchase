import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainException } from '../../domain/exceptions';
import {
  ApplicationException,
  EntityNotFoundException,
  DuplicateResourceException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
} from '../../application/exceptions';

/**
 * Maps Application and Domain Exceptions to appropriate RESTful HTTP Status Codes.
 * The Presentation Layer holds full responsibility for HTTP protocol mapping,
 * keeping both Domain and Application layers pure and independent of HTTP.
 */
const mapApplicationErrorToHttpStatus = (err: ApplicationException): number => {
  if (err instanceof EntityNotFoundException) return 404;      // Not Found
  if (err instanceof DuplicateResourceException) return 409;   // Conflict
  if (err instanceof UnauthorizedException) return 401;        // Unauthorized
  if (err instanceof ForbiddenException) return 403;           // Forbidden
  if (err instanceof ValidationException) return 400;          // Bad Request
  return 400;                                                  // Generic Application Error
};

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Zod Schema Validation Errors (API syntactic check)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Application Layer Exceptions (UseCase Coordination, Auth, Resource Lifecycle)
  if (err instanceof ApplicationException) {
    const statusCode = mapApplicationErrorToHttpStatus(err);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Domain Layer Exceptions (Pure Business Rule & Invariant Violations)
  if (err instanceof DomainException) {
    const statusCode = 422; // Always 422 Unprocessable Entity for Domain Invariants
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'BUSINESS_RULE_VIOLATION',
        message: err.message,
        details: err.details ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Generic Errors & Server Failures
  const statusCode =
    typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode <= 599
      ? err.statusCode
      : 500;

  if (statusCode >= 500) {
    console.error('[CRITICAL SERVER ERROR]:', err);
  } else {
    console.warn('[API Client Error]:', err.message || err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
      message: statusCode === 500 ? 'Đã xảy ra lỗi hệ thống không mong muốn' : err.message,
      details: err.details ?? null,
    },
    timestamp: new Date().toISOString(),
  });
};
