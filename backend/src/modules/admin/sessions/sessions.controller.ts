import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';

export async function getLiveSessions(req: Request, res: Response) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: { lastSeen: { gte: fiveMinutesAgo } },
      include: {
        user: { select: { username: true, fullName: true } },
        channel: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { lastSeen: 'desc' },
    });

    const result = sessions.map((s) => ({
      id: s.id,
      user: s.user,
      channel: s.channel,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      lastSeen: s.lastSeen,
      createdAt: s.createdAt,
      duration: Math.floor((Date.now() - s.createdAt.getTime()) / 1000),
    }));

    return success(res, result);
  } catch (err) {
    return error(res, 'Error al obtener sesiones', 500);
  }
}

export async function forceCloseSession(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.session.delete({ where: { id } });

    return success(res, null, 'Sesión cerrada forzosamente');
  } catch (err) {
    return error(res, 'Error al cerrar sesión', 500);
  }
}
