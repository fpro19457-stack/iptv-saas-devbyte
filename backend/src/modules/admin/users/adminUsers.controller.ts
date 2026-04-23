import { Request, Response } from 'express';
import { body, query } from 'express-validator';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';
import { hashPassword } from '../../../utils/password';

export const listValidation = [
  query('page').optional().isInt().withMessage('Page debe ser un número'),
  query('limit').optional().isInt().withMessage('Limit debe ser un número'),
  query('search').optional().isString(),
  query('status').optional().isString(),
  validate,
];

export async function listUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userPacks: { include: { pack: true } },
          sessions: {
            where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const result = users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      status: u.status,
      expiresAt: u.expiresAt,
      maxDevices: u.maxDevices,
      createdAt: u.createdAt,
      packs: u.userPacks.map((up) => up.pack),
      activeSessions: u.sessions.length,
    }));

    return success(res, {
      users: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return error(res, 'Error al listar usuarios', 500);
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userPacks: { include: { pack: true } },
        sessions: {
          where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
          include: { channel: true },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { channel: true },
        },
      },
    });

    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
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
      createdAt: user.createdAt,
      packs: user.userPacks.map((up) => up.pack),
      sessions: user.sessions,
      recentActivity: user.activityLogs,
    });
  } catch (err) {
    return error(res, 'Error al obtener usuario', 500);
  }
}

export const createValidation = [
  body('username').notEmpty().withMessage('Username requerido'),
  body('password').notEmpty().withMessage('Password requerido'),
  validate,
];

export async function createUser(req: Request, res: Response) {
  try {
    const { username, password, fullName, email, maxDevices, status, expiresAt, pin, packIds } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return error(res, 'El username ya existe', 400);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName: fullName || null,
        email: email || null,
        maxDevices: maxDevices || 2,
        status: status || 'TRIAL',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        pin: pin || null,
      },
    });

    if (packIds && packIds.length > 0) {
      await prisma.userPack.createMany({
        data: packIds.map((packId: string) => ({ userId: user.id, packId })),
      });
    }

    return success(res, { id: user.id, username: user.username }, 'Usuario creado', 201);
  } catch (err) {
    return error(res, 'Error al crear usuario', 500);
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, fullName, email, maxDevices, status, expiresAt, pin } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username !== undefined && { username }),
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(maxDevices !== undefined && { maxDevices }),
        ...(status !== undefined && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(pin !== undefined && { pin }),
      },
    });

    return success(res, user, 'Usuario actualizado');
  } catch (err) {
    return error(res, 'Error al actualizar usuario', 500);
  }
}

export async function changeStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'].includes(status)) {
      return error(res, 'Estado inválido', 400);
    }

    if (status === 'SUSPENDED' || status === 'EXPIRED') {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return success(res, user, `Usuario marcado como ${status}`);
  } catch (err) {
    return error(res, 'Error al cambiar estado', 500);
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    return success(res, null, 'Usuario eliminado');
  } catch (err) {
    return error(res, 'Error al eliminar usuario', 500);
  }
}

export async function getUserSessions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sessions = await prisma.session.findMany({
      where: {
        userId: id,
        lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      include: { channel: true },
      orderBy: { lastSeen: 'desc' },
    });

    return success(res, sessions);
  } catch (err) {
    return error(res, 'Error al obtener sesiones', 500);
  }
}

export async function closeSession(req: Request, res: Response) {
  try {
    const { id, sessionId } = req.params;

    await prisma.session.delete({ where: { id: sessionId, userId: id } });

    return success(res, null, 'Sesión cerrada');
  } catch (err) {
    return error(res, 'Error al cerrar sesión', 500);
  }
}

export async function closeAllSessions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.session.deleteMany({ where: { userId: id } });

    return success(res, null, 'Todas las sesiones cerradas');
  } catch (err) {
    return error(res, 'Error al cerrar sesiones', 500);
  }
}
