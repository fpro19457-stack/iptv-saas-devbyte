import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';

export const sendValidation = [
  body('title').notEmpty().withMessage('Título requerido'),
  body('message').notEmpty().withMessage('Mensaje requerido'),
  validate,
];

export async function sendNotification(req: Request, res: Response) {
  try {
    const { userId, title, message, type } = req.body;

    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: type || 'INFO',
        },
      });
    } else {
      const activeUsers = await prisma.user.findMany({
        where: { status: { in: ['ACTIVE', 'TRIAL'] } },
        select: { id: true },
      });

      await prisma.notification.createMany({
        data: activeUsers.map((u) => ({
          userId: u.id,
          title,
          message,
          type: type || 'INFO',
        })),
      });
    }

    return success(res, null, 'Notificación enviada');
  } catch (err) {
    return error(res, 'Error al enviar notificación', 500);
  }
}

export async function getNotificationHistory(req: Request, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { username: true, fullName: true } },
      },
    });

    return success(res, notifications);
  } catch (err) {
    return error(res, 'Error al obtener historial', 500);
  }
}
