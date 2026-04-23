import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';

export async function listPacks(req: Request, res: Response) {
  try {
    const packs = await prisma.pack.findMany({
      include: {
        packChannels: {
          include: { channel: true },
        },
        userPacks: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = packs.map((pack) => ({
      ...pack,
      channels: pack.packChannels.map((pc) => pc.channel),
      userCount: pack.userPacks.length,
      userPacks: undefined,
      packChannels: undefined,
    }));

    return success(res, result);
  } catch (err) {
    return error(res, 'Error al listar packs', 500);
  }
}

export const createValidation = [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('color').notEmpty().withMessage('Color requerido'),
  body('icon').notEmpty().withMessage('Icono requerido'),
  validate,
];

export async function createPack(req: Request, res: Response) {
  try {
    const { name, description, color, icon } = req.body;

    const pack = await prisma.pack.create({
      data: {
        name,
        description: description || null,
        color,
        icon,
      },
    });

    return success(res, pack, 'Pack creado', 201);
  } catch (err) {
    return error(res, 'Error al crear pack', 500);
  }
}

export async function updatePack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, color, icon, isActive } = req.body;

    const pack = await prisma.pack.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return success(res, pack, 'Pack actualizado');
  } catch (err) {
    return error(res, 'Error al actualizar pack', 500);
  }
}

export async function deletePack(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const userCount = await prisma.userPack.count({ where: { packId: id } });
    if (userCount > 0) {
      return error(res, 'No se puede eliminar un pack con usuarios asignados', 400);
    }

    await prisma.pack.delete({ where: { id } });

    return success(res, null, 'Pack eliminado');
  } catch (err) {
    return error(res, 'Error al eliminar pack', 500);
  }
}

export async function assignChannels(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { channelIds } = req.body as { channelIds: string[] };

    await prisma.packChannel.deleteMany({ where: { packId: id } });

    if (channelIds.length > 0) {
      await prisma.packChannel.createMany({
        data: channelIds.map((channelId) => ({ packId: id, channelId })),
      });
    }

    return success(res, null, 'Canales asignados');
  } catch (err) {
    return error(res, 'Error al asignar canales', 500);
  }
}

export async function removeChannel(req: Request, res: Response) {
  try {
    const { id, channelId } = req.params;

    await prisma.packChannel.delete({
      where: {
        packId_channelId: { packId: id, channelId },
      },
    });

    return success(res, null, 'Canal quitado del pack');
  } catch (err) {
    return error(res, 'Error al quitar canal', 500);
  }
}
