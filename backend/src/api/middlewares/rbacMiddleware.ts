import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException, ForbiddenException } from '../../application/exceptions';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new UnauthorizedException(
          'Vui lòng đăng nhập trước khi thực hiện thao tác này',
          'UNAUTHORIZED'
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenException(
          `Bạn không có quyền thực hiện chức năng này. Yêu cầu quyền: ${allowedRoles.join(', ')}`,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};

