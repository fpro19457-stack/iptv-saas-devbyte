import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';

export async function assignPack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { packId, packIds } = req.body;

    const idsToAssign = packIds || (packId ? [packId] : []);

    if (idsToAssign.length === 0) {
      return error(res, 'Se requiere packId o packIds', 400);
    }

    for (const pid of idsToAssign) {
      const existing = await prisma.userPack.findUnique({
        where: { userId_packId: { userId: id, packId: pid } },
      });

      if (!existing) {
        await prisma.userPack.create({
          data: { userId: id, packId: pid },
        });
      }
    }

    return success(res, null, `${idsToAssign.length} pack(s) asignado(s)`);
  } catch (err) {
    return error(res, 'Error al asignar pack', 500);
  }
}

export async function replaceUserPacks(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { packIds } = req.body as { packIds: string[] };

    await prisma.userPack.deleteMany({ where: { userId: id } });

    if (packIds && packIds.length > 0) {
      await prisma.userPack.createMany({
        data: packIds.map((packId) => ({ userId: id, packId })),
      });
    }

    return success(res, null, 'Packs actualizados');
  } catch (err) {
    return error(res, 'Error al actualizar packs', 500);
  }
}

export async function removePack(req: Request, res: Response) {
  try {
    const { id, packId } = req.params;

    await prisma.userPack.delete({
      where: { userId_packId: { userId: id, packId } },
    });

    return success(res, null, 'Pack removido');
  } catch (err) {
    return error(res, 'Error al quitar pack', 500);
  }
}

export async function getUserPacks(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const userPacks = await prisma.userPack.findMany({
      where: { userId: id },
      include: { pack: true },
    });

    return success(res, userPacks.map((up) => up.pack));
  } catch (err) {
    return error(res, 'Error al obtener packs', 500);
  }
}
