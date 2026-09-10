import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../../src/api/middlewares/validateMiddleware';

describe('validateMiddleware (Zod Schema Validation)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    nextFunction = jest.fn();
  });

  describe('validateBody', () => {
    const testBodySchema = z.object({
      name: z.string().min(3),
      quantity: z.number().int().positive(),
    });

    it('should parse valid body and call next() without error', () => {
      mockReq.body = {
        name: 'Item A',
        quantity: 10,
      };

      const middleware = validateBody(testBodySchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'Item A', quantity: 10 });
    });

    it('should pass ZodError to next() when body fails schema validation', () => {
      mockReq.body = {
        name: 'X', // too short (< 3)
        quantity: -5, // not positive
      };

      const middleware = validateBody(testBodySchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('validateQuery', () => {
    const testQuerySchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    it('should parse valid query and call next() without error', () => {
      mockReq.query = {
        page: '2' as any,
        limit: '50' as any,
      };

      const middleware = validateQuery(testQuerySchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({ page: 2, limit: 50 });
    });

    it('should pass ZodError to next() when query fails schema validation', () => {
      mockReq.query = {
        limit: '999' as any, // exceeds max 100
      };

      const middleware = validateQuery(testQuerySchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('validateParams', () => {
    const testParamsSchema = z.object({
      sku: z.string().regex(/^SKU-[0-9]{4}$/),
    });

    it('should parse valid params and call next() without error', () => {
      mockReq.params = {
        sku: 'SKU-1234',
      };

      const middleware = validateParams(testParamsSchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockReq.params).toEqual({ sku: 'SKU-1234' });
    });

    it('should pass ZodError to next() when params fail schema validation', () => {
      mockReq.params = {
        sku: 'invalid-sku-format',
      };

      const middleware = validateParams(testParamsSchema);
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('Integration with errorMiddleware (Pipeline Verification)', () => {
    it('should result in 400 VALIDATION_ERROR with field details when handled by errorMiddleware', () => {
      const { errorMiddleware } = require('../../../src/api/middlewares/errorMiddleware');

      const testSchema = z.object({
        email: z.string().email('Email không đúng định dạng'),
      });

      mockReq.body = { email: 'not-an-email' };
      const statusFn = jest.fn().mockReturnThis();
      const jsonFn = jest.fn().mockReturnThis();
      mockRes = {
        status: statusFn,
        json: jsonFn,
        headersSent: false,
      };

      let capturedError: any = null;
      const captureNext = jest.fn((err?: any) => {
        capturedError = err;
      });

      // 1. Run validateBody
      validateBody(testSchema)(mockReq as Request, mockRes as Response, captureNext);
      expect(capturedError).toBeInstanceOf(ZodError);

      // 2. Pass error to errorMiddleware
      errorMiddleware(capturedError, mockReq as Request, mockRes as Response, jest.fn());

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu đầu vào không hợp lệ',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Email không đúng định dạng',
              }),
            ]),
          }),
        })
      );
    });
  });
});
