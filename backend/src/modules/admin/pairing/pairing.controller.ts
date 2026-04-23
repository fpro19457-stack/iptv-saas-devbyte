import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { verifyAccessToken } from '../../../utils/jwt';

interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

export async function approvePairing(req: AdminAuthRequest, res: Response) {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return error(res, 'Código y usuario son requeridos', 400);
    }

    const pairingCode = await prisma.pairingCode.findUnique({
      where: { code },
    });

    if (!pairingCode) {
      return error(res, 'Código no encontrado', 404);
    }

    if (pairingCode.status === 'EXPIRED' || pairingCode.expiresAt < new Date()) {
      return error(res, 'El código expiró. El cliente debe generar uno nuevo.', 400);
    }

    if (pairingCode.status !== 'PENDING') {
      return error(res, 'Código ya usado o inválido', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    if (user.status !== 'ACTIVE' && user.status !== 'TRIAL') {
      return error(res, 'El usuario debe estar activo para emparejar', 400);
    }

    await prisma.pairingCode.update({
      where: { id: pairingCode.id },
      data: {
        status: 'APPROVED',
        userId,
        approvedAt: new Date(),
      },
    });

    return success(res, {
      success: true,
      message: 'TV autorizado. El cliente ya puede ver.',
    });
  } catch (err) {
    return error(res, 'Error al aprobar código', 500);
  }
}

export async function getPendingPairings(req: AdminAuthRequest, res: Response) {
  try {
    const now = new Date();

    const pendingCodes = await prisma.pairingCode.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      include: {
        user: { select: { username: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = pendingCodes.map((pc) => {
      const tiempoRestante = Math.max(0, Math.floor((pc.expiresAt.getTime() - now.getTime()) / 1000));
      return {
        id: pc.id,
        code: pc.code,
        ipAddress: pc.ipAddress,
        createdAt: pc.createdAt,
        expiresAt: pc.expiresAt,
        tiempoRestante,
        user: pc.user,
      };
    });

    return success(res, result);
  } catch (err) {
    return error(res, 'Error al obtener códigos pendientes', 500);
  }
}