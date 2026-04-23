import { Request, Response } from 'express';
import prisma from '../../config/database';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { success, error } from '../../utils/response';

interface AuthRequest extends Request {
  user?: { id: string; username: string; status: string };
  sessionId?: string;
}

function createRandomCode(): string {
  const part1 = Math.floor(Math.random() * 900 + 100).toString();
  const part2 = Math.floor(Math.random() * 900 + 100).toString();
  return `${part1}-${part2}`;
}

export async function generatePairingCode(req: Request, res: Response) {
  try {
    let code: string;
    let attempts = 0;

    do {
      code = createRandomCode();
      const existing = await prisma.pairingCode.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return error(res, 'No se pudo generar un código único', 500);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const pairingCode = await prisma.pairingCode.create({
      data: {
        code,
        ipAddress: req.ip || '0.0.0.0',
        expiresAt,
        status: 'PENDING',
      },
    });

    return success(res, {
      code: pairingCode.code,
      expiresAt: pairingCode.expiresAt,
      expiresInSeconds: 600,
    }, 'Código generado');
  } catch (err) {
    return error(res, 'Error al generar código', 500);
  }
}

export async function getPairingStatus(req: Request, res: Response) {
  try {
    const { code } = req.params;

    const pairingCode = await prisma.pairingCode.findUnique({
      where: { code },
      include: { user: { select: { username: true, fullName: true } } },
    });

    if (!pairingCode) {
      return error(res, 'Código no encontrado', 404);
    }

    const now = new Date();

    if (pairingCode.status === 'EXPIRED' || pairingCode.expiresAt < now) {
      if (pairingCode.status !== 'EXPIRED') {
        await prisma.pairingCode.update({
          where: { id: pairingCode.id },
          data: { status: 'EXPIRED' },
        });
      }
      return success(res, { status: 'EXPIRED' });
    }

    if (pairingCode.status === 'PENDING') {
      return success(res, { status: 'PENDING' });
    }

    if (pairingCode.status === 'APPROVED') {
      if (!pairingCode.userId || !pairingCode.user) {
        return error(res, 'Código no asignado a usuario', 500);
      }

      await prisma.pairingCode.update({
        where: { id: pairingCode.id },
        data: { status: 'USED' },
      });

      const user = pairingCode.user;
      const accessToken = generateAccessToken({ userId: pairingCode.userId, username: user.username });
      const refreshToken = generateRefreshToken(pairingCode.userId);

      await prisma.session.create({
        data: {
          userId: pairingCode.userId,
          deviceName: 'TV',
          deviceType: 'TV',
          ipAddress: pairingCode.ipAddress,
          userAgent: req.headers['user-agent'] || 'TV',
          token: accessToken,
          lastSeen: new Date(),
        },
      });

      return success(res, {
        status: 'APPROVED',
        accessToken,
        refreshToken,
        user: {
          username: user.username,
          fullName: user.fullName,
        },
      });
    }

    if (pairingCode.status === 'USED') {
      return success(res, { status: 'USED' });
    }

    return error(res, 'Estado inválido', 500);
  } catch (err) {
    return error(res, 'Error al verificar código', 500);
  }
}