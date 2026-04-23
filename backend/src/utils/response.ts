import { Response } from 'express';

export function success(res: Response, data?: any, message?: string, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message: message || 'OK',
    data,
  });
}

export function error(res: Response, message: string, statusCode = 400, details?: any) {
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}
