import { Router, Request } from 'express';
import { body } from 'express-validator';
import prisma from '../../config/database';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; username: string; status: string };
}

router.use(authenticate);

export async function listFavorites(req: AuthRequest, res: any) {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      select: { channelId: true },
    });

    return success(res, favorites.map(f => f.channelId));
  } catch (err) {
    return error(res, 'Error al obtener favoritos', 500);
  }
}

export async function addFavorite(req: AuthRequest, res: any) {
  try {
    const userId = req.user!.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return error(res, 'Canal no encontrado', 404);
    }

    await prisma.userFavorite.upsert({
      where: {
        userId_channelId: { userId, channelId }
      },
      create: { userId, channelId },
      update: {},
    });

    return success(res, null, 'Canal agregado a favoritos');
  } catch (err) {
    return error(res, 'Error al agregar favorito', 500);
  }
}

export async function removeFavorite(req: AuthRequest, res: any) {
  try {
    const userId = req.user!.id;
    const { channelId } = req.params;

    await prisma.userFavorite.delete({
      where: {
        userId_channelId: { userId, channelId }
      },
    });

    return success(res, null, 'Canal eliminado de favoritos');
  } catch (err) {
    return error(res, 'Error al eliminar favorito', 500);
  }
}

router.get('/', listFavorites);
router.post('/:channelId', addFavorite);
router.delete('/:channelId', removeFavorite);

export default router;