import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { error } from '../utils/response';

interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

export async function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return error(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload || !('adminId' in payload)) {
      return error(res, 'Token inválido o expirado', 401);
    }

    req.admin = {
      id: (payload as any).adminId,
      username: payload.username,
      role: (payload as any).role,
    };

    next();
  } catch (err) {
    return error(res, 'Error de autenticación', 401);
  }
}
