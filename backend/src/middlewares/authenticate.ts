import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/database';
import { error } from '../utils/response';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    status: string;
  };
  sessionId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return error(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload || !('userId' in payload)) {
      return error(res, 'Token inválido o expirado', 401);
    }

    const session = await prisma.session.findFirst({
      where: {
        token: token,
        userId: payload.userId,
        lastSeen: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      return error(res, 'Sesión inválida o expirada', 401);
    }

    if (session.user.status === 'SUSPENDED') {
      return error(res, 'Tu cuenta está suspendida. Contacta al administrador.', 403);
    }

    if (session.user.status === 'EXPIRED') {
      return error(res, 'Tu suscripción venció. Contacta al administrador para renovar.', 403);
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeen: new Date() },
    });

    req.user = {
      id: session.user.id,
      username: session.user.username,
      status: session.user.status,
    };
    req.sessionId = session.id;

    next();
  } catch (err) {
    return error(res, 'Error de autenticación', 401);
  }
}
