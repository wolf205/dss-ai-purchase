import { Request, Response, NextFunction } from 'express';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Vui lòng đăng nhập trước khi thực hiện thao tác này',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Bạn không có quyền thực hiện chức năng này. Yêu cầu quyền: ${allowedRoles.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
