import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { DomainException } from '../../domain/exceptions';
import {
  ApplicationException,
  EntityNotFoundException,
  DuplicateResourceException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
  TooManyRequestsException,
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
  if (err instanceof TooManyRequestsException) return 429;     // Too Many Requests
  return 400;                                                  // Generic Application Error
};

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Guard against crashing if headers have already been sent to client
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Đã xảy ra lỗi hệ thống không mong muốn';
  let details: any = null;

  // 2. Syntax errors from express.json() / body-parser
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    statusCode = 400;
    code = 'INVALID_JSON_BODY';
    message = 'Cú pháp dữ liệu JSON gửi lên không hợp lệ';
  }

  // 3. Multer / File Upload Errors (Multipart handling)
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = 'FILE_TOO_LARGE';
      message = 'Dung lượng tệp tin vượt quá giới hạn tối đa cho phép (10MB)';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = 'UNEXPECTED_FILE_FIELD';
      message = `Trường tệp tin không hợp lệ: ${err.field}`;
    } else {
      code = 'FILE_UPLOAD_ERROR';
      message = `Lỗi tải tệp tin lên hệ thống: ${err.message}`;
    }
  }

  // 4. Custom file format rejection from multer fileFilter
  else if (err?.code === 'INVALID_FILE_FORMAT' || (err?.message && err.message.includes('Định dạng file không hỗ trợ'))) {
    statusCode = 400;
    code = 'INVALID_FILE_FORMAT';
    message = err.message || 'Định dạng file không được hỗ trợ';
  }

  // 5. Zod Schema Validation Errors (API syntactic check)
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dữ liệu đầu vào không hợp lệ';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // 6. Application Layer Exceptions (UseCase Coordination, Auth, Resource Lifecycle)
  else if (err instanceof ApplicationException) {
    statusCode = mapApplicationErrorToHttpStatus(err);
    code = err.code;
    message = err.message;
    details = err.details ?? null;
  }

  // 7. Domain Layer Exceptions (Pure Business Rule & Invariant Violations)
  else if (err instanceof DomainException) {
    statusCode = 422; // Always 422 Unprocessable Entity for Domain Invariants
    code = err.code || 'BUSINESS_RULE_VIOLATION';
    message = err.message;
    details = err.details ?? null;
  }

  // 8. Generic Errors & Server Failures
  else {
    const rawStatus = err.statusCode || err.status;
    if (typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus <= 599) {
      statusCode = rawStatus;
      code = err.code || 'BAD_REQUEST';
      message = err.message;
      details = err.details ?? null;
    }

    if (statusCode >= 500) {
      console.error('[CRITICAL SERVER ERROR]:', err);
    } else {
      console.warn('[API Client Error]:', err.message || err);
    }
  }

  // 9. Single Point of Return: Guaranteed consistent envelope
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
    timestamp: new Date().toISOString(),
  });
};
