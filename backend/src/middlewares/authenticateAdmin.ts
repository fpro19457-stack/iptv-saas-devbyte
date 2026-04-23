import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../utils/jwt';
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
    const payload = verifyAdminToken(token);

    if (!payload || !('adminId' in payload)) {
      return error(res, 'Token inválido o expirado', 401);
    }

    req.admin = {
      id: payload.adminId,
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch (err) {
    return error(res, 'Error de autenticación', 401);
  }
}
