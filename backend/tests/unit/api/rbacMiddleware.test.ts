import { Request, Response, NextFunction } from 'express';
import { rbacMiddleware } from '../../../src/api/middlewares/rbacMiddleware';
import { UnauthorizedException, ForbiddenException } from '../../../src/application/exceptions';

describe('rbacMiddleware (Role-Based Access Control)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    nextFunction = jest.fn();
  });

  it('should pass UnauthorizedException to next() when req.user is undefined', () => {
    mockReq.user = undefined;

    const middleware = rbacMiddleware(['ADMIN']);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Vui lòng đăng nhập trước khi thực hiện thao tác này',
      })
    );
  });

  it('should pass ForbiddenException to next() when user role is not in allowedRoles', () => {
    mockReq.user = {
      userId: 'user-123',
      username: 'staff_user',
      role: 'STAFF',
    };

    const middleware = rbacMiddleware(['ADMIN']);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenException));
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FORBIDDEN',
        message: expect.stringContaining('ADMIN'),
      })
    );
  });

  it('should call next() without error when user role matches allowedRoles', () => {
    mockReq.user = {
      userId: 'admin-123',
      username: 'admin_user',
      role: 'ADMIN',
    };

    const middleware = rbacMiddleware(['ADMIN']);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() without error when user role is one of multiple allowed roles', () => {
    mockReq.user = {
      userId: 'staff-456',
      username: 'staff_user',
      role: 'STAFF',
    };

    const middleware = rbacMiddleware(['ADMIN', 'STAFF']);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith();
  });

  describe('Integration with errorMiddleware (Pipeline Verification)', () => {
    it('should result in 401 UNAUTHORIZED when unauthenticated request is handled by errorMiddleware', () => {
      const { errorMiddleware } = require('../../../src/api/middlewares/errorMiddleware');

      mockReq.user = undefined;
      const statusFn = jest.fn().mockReturnThis();
      const jsonFn = jest.fn().mockReturnThis();
      mockRes = { status: statusFn, json: jsonFn, headersSent: false };

      let capturedError: any = null;
      rbacMiddleware(['ADMIN'])(mockReq as Request, mockRes as Response, (err) => {
        capturedError = err;
      });

      expect(capturedError).toBeInstanceOf(UnauthorizedException);

      errorMiddleware(capturedError, mockReq as Request, mockRes as Response, jest.fn());

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập trước khi thực hiện thao tác này',
          }),
        })
      );
    });

    it('should result in 403 FORBIDDEN when unauthorized role is handled by errorMiddleware', () => {
      const { errorMiddleware } = require('../../../src/api/middlewares/errorMiddleware');

      mockReq.user = { userId: 'u1', username: 'staff1', role: 'STAFF' };
      const statusFn = jest.fn().mockReturnThis();
      const jsonFn = jest.fn().mockReturnThis();
      mockRes = { status: statusFn, json: jsonFn, headersSent: false };

      let capturedError: any = null;
      rbacMiddleware(['ADMIN'])(mockReq as Request, mockRes as Response, (err) => {
        capturedError = err;
      });

      expect(capturedError).toBeInstanceOf(ForbiddenException);

      errorMiddleware(capturedError, mockReq as Request, mockRes as Response, jest.fn());

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            message: expect.stringContaining('ADMIN'),
          }),
        })
      );
    });
  });
});
