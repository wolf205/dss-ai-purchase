import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorMiddleware } from '../../../src/api/middlewares/errorMiddleware';
import {
  DomainException,
  InvalidWeightDistributionException,
  InvalidOrderStateException,
} from '../../../src/domain/exceptions';
import {
  ValidationException,
  EntityNotFoundException,
  DuplicateResourceException,
  UnauthorizedException,
  ForbiddenException,
  TooManyRequestsException,
} from '../../../src/application/exceptions';

describe('errorMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  it('should map EntityNotFoundException to 404 RESOURCE_NOT_FOUND', () => {
    const err = new EntityNotFoundException('sản phẩm', 'SKU-001');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Không tìm thấy sản phẩm với mã/ID: SKU-001',
        }),
      })
    );
  });

  it('should map DuplicateResourceException to 409 DUPLICATE_RESOURCE', () => {
    const err = new DuplicateResourceException('Mã SKU', 'SKU-001');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_RESOURCE',
          message: 'Giá trị "SKU-001" của trường Mã SKU đã tồn tại trên hệ thống',
        }),
      })
    );
  });

  it('should map UnauthorizedException to 401 INVALID_CREDENTIALS', () => {
    const err = new UnauthorizedException('Sai mật khẩu', 'INVALID_CREDENTIALS');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_CREDENTIALS',
          message: 'Sai mật khẩu',
        }),
      })
    );
  });

  it('should map ForbiddenException to 403 ACCOUNT_LOCKED', () => {
    const err = new ForbiddenException('Tài khoản bị khóa', 'ACCOUNT_LOCKED');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản bị khóa',
        }),
      })
    );
  });

  it('should map ValidationException to 400 VALIDATION_ERROR', () => {
    const err = new ValidationException('Dữ liệu không hợp lệ');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
        }),
      })
    );
  });

  it('should map TooManyRequestsException to 429 TOO_MANY_REQUESTS', () => {
    const err = new TooManyRequestsException(
      'Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau 15 phút.',
      'TOO_MANY_REQUESTS'
    );
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TOO_MANY_REQUESTS',
          message: 'Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau 15 phút.',
        }),
      })
    );
  });

  it('should map InvalidWeightDistributionException to 422 WEIGHT_SUM_INVALID', () => {
    const err = new InvalidWeightDistributionException();
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'WEIGHT_SUM_INVALID',
        }),
      })
    );
  });

  it('should map InvalidOrderStateException to 422 INVALID_STATE_TRANSITION', () => {
    const err = new InvalidOrderStateException('Đơn hàng không thể chuyển trạng thái');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_STATE_TRANSITION',
        }),
      })
    );
  });

  it('should map base DomainException to 422 BUSINESS_RULE_VIOLATION', () => {
    const err = new DomainException('Vi phạm quy tắc kho');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Vi phạm quy tắc kho',
        }),
      })
    );
  });

  it('should map ZodError to 400 VALIDATION_ERROR with structured details', () => {
    const schema = z.object({ sku: z.string().min(3) });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ sku: 'a' });
    } catch (e: any) {
      zodError = e;
    }

    errorMiddleware(zodError, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'sku' }),
          ]),
        }),
      })
    );
  });

  it('should map unexpected generic error to 500 INTERNAL_SERVER_ERROR', () => {
    const err = new Error('Database connection crashed');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã xảy ra lỗi hệ thống không mong muốn',
        }),
      })
    );
  });

  it('should map Multer LIMIT_FILE_SIZE error to 400 FILE_TOO_LARGE', () => {
    const multer = require('multer');
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'FILE_TOO_LARGE',
          message: 'Dung lượng tệp tin vượt quá giới hạn tối đa cho phép (10MB)',
        }),
      })
    );
  });

  it('should map unsupported file format error to 400 INVALID_FILE_FORMAT', () => {
    const err = new Error('Định dạng file không hỗ trợ. Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_FILE_FORMAT',
          message: expect.stringContaining('Định dạng file không hỗ trợ'),
        }),
      })
    );
  });

  it('should delegate to next(err) without sending response if res.headersSent is true', () => {
    mockRes.headersSent = true;
    const err = new Error('Some error after headers sent');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should map body-parser JSON SyntaxError to 400 INVALID_JSON_BODY', () => {
    const syntaxErr: any = new SyntaxError('Unexpected token } in JSON at position 12');
    syntaxErr.body = '{"bad": }';
    syntaxErr.status = 400;

    errorMiddleware(syntaxErr, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_JSON_BODY',
          message: 'Cú pháp dữ liệu JSON gửi lên không hợp lệ',
        }),
      })
    );
  });
});
