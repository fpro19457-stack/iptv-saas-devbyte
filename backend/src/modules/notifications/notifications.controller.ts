import { Request, Response } from 'express';
import prisma from '../../config/database';
import { success, error } from '../../utils/response';

interface AuthRequest extends Request {
  user?: { id: string };
}

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
      },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });

    return success(res, notifications);
  } catch (err) {
    return error(res, 'Error al obtener notificaciones', 500);
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success(res, null, 'Notificación marcada como leída');
  } catch (err) {
    return error(res, 'Error al actualizar notificación', 500);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return success(res, null, 'Todas marcadas como leídas');
  } catch (err) {
    return error(res, 'Error al actualizar notificaciones', 500);
  }
}
