import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../config/database';
import { comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { success, error } from '../../utils/response';
import { validate } from '../../middlewares/validate';

interface AuthRequest extends Request {
  user?: { id: string; username: string; status: string };
  sessionId?: string;
}

export const loginValidation = [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  validate,
];

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password, deviceName, deviceType } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    if (user.status === 'SUSPENDED') {
      return error(res, 'Tu cuenta está suspendida. Contacta al administrador.', 403);
    }

    if (user.status === 'EXPIRED') {
      return error(res, 'Tu suscripción venció. Contacta al administrador para renovar.', 403);
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    const activeSessions = await prisma.session.count({
      where: {
        userId: user.id,
        lastSeen: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    if (activeSessions >= user.maxDevices) {
      return error(
        res,
        `Límite de dispositivos alcanzado (${activeSessions}/${user.maxDevices} activos). Cerrá sesión en otro dispositivo.`,
        403
      );
    }

    const accessToken = generateAccessToken({ userId: user.id, username: user.username });
    const refreshToken = generateRefreshToken(user.id);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        deviceName: deviceName || 'Dispositivo desconocido',
        deviceType: deviceType || 'UNKNOWN',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        token: accessToken,
        lastSeen: new Date(),
      },
    });

    return success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        status: user.status,
        expiresAt: user.expiresAt,
      },
    }, 'Login exitoso');
  } catch (err) {
    return error(res, 'Error en el servidor', 500);
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (req.sessionId) {
      await prisma.session.delete({ where: { id: req.sessionId } });
    }
    return success(res, null, 'Logout exitoso');
  } catch (err) {
    return error(res, 'Error al cerrar sesión', 500);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, 'Refresh token requerido', 400);
    }

    const payload = (await import('../../utils/jwt')).verifyRefreshToken(refreshToken);
    if (!payload) {
      return error(res, 'Refresh token inválido o expirado', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    const newAccessToken = generateAccessToken({ userId: user.id, username: user.username });

    return success(res, { accessToken: newAccessToken });
  } catch (err) {
    return error(res, 'Error al refresh token', 500);
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        userPacks: {
          include: {
            pack: true,
          },
        },
      },
    });

    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    if (req.sessionId) {
      await prisma.session.update({
        where: { id: req.sessionId },
        data: { lastSeen: new Date() },
      });
    }

    return success(res, {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      expiresAt: user.expiresAt,
      maxDevices: user.maxDevices,
      pin: user.pin,
      packs: user.userPacks.map((up) => up.pack),
      unreadNotifications,
    });
  } catch (err) {
    return error(res, 'Error al obtener usuario', 500);
  }
}
