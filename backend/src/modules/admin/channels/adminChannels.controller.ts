import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';
import { cache } from '../../../utils/cache';

export const listValidation = [
  query('page').optional().isInt().withMessage('Page debe ser un número'),
  query('limit').optional().isInt().withMessage('Limit debe ser un número'),
  query('search').optional().isString(),
  query('category').optional().isString(),
  validate,
];

export async function listChannels(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { number: { equals: parseInt(search) || 0 } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { packChannels: { include: { pack: true } } },
      }),
      prisma.channel.count({ where }),
    ]);

    return success(res, {
      channels,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return error(res, 'Error al listar canales', 500);
  }
}

export const createValidation = [
  body('number').isInt().withMessage('Número requerido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('streamUrl').notEmpty().withMessage('URL del stream requerida'),
  body('category').notEmpty().withMessage('Categoría requerida'),
  validate,
];

export async function createChannel(req: Request, res: Response) {
  try {
    const { number, name, logoUrl, streamUrl, streamUrlBackup, category, isAdult, quality, packIds } = req.body;

    const channelNumber = parseInt(number, 10);
    if (isNaN(channelNumber)) {
      return error(res, 'El número de canal debe ser un número válido', 400);
    }

    const existing = await prisma.channel.findUnique({ where: { number: channelNumber } });
    if (existing) {
      return error(res, 'El número de canal ya existe', 400);
    }

    const maxOrder = await prisma.channel.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

    const channel = await prisma.channel.create({
      data: {
        number: channelNumber,
        name,
        logoUrl: logoUrl || null,
        streamUrl,
        streamUrlBackup: streamUrlBackup || null,
        category,
        isAdult: isAdult || false,
        quality: quality || 'SD',
        sortOrder,
        packChannels: packIds?.length
          ? { create: packIds.map((packId: string) => ({ packId })) }
          : undefined,
      },
    });

    cache.invalidatePattern('channels:');

    return success(res, channel, 'Canal creado', 201);
  } catch (err) {
    return error(res, 'Error al crear canal', 500);
  }
}

export async function updateChannel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { number, name, logoUrl, streamUrl, streamUrlBackup, category, isAdult, quality, isActive, streamUrlSD, streamUrlHD, streamUrlFHD, defaultQuality, packIds } = req.body;

    if (number !== undefined) {
      const parsed = parseInt(number, 10);
      if (isNaN(parsed)) {
        return error(res, 'El número de canal debe ser un número válido', 400);
      }
      const existing = await prisma.channel.findFirst({
        where: { number: parsed, id: { not: id } },
      });
      if (existing) {
        return error(res, 'El número de canal ya existe', 400);
      }
    }

    const channel = await prisma.channel.update({
      where: { id },
      data: {
        ...(number !== undefined && { number: parseInt(number, 10) }),
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(streamUrl !== undefined && { streamUrl }),
        ...(streamUrlBackup !== undefined && { streamUrlBackup }),
        ...(category !== undefined && { category }),
        ...(isAdult !== undefined && { isAdult }),
        ...(quality !== undefined && { quality }),
        ...(isActive !== undefined && { isActive }),
        ...(streamUrlSD !== undefined && { streamUrlSD }),
        ...(streamUrlHD !== undefined && { streamUrlHD }),
        ...(streamUrlFHD !== undefined && { streamUrlFHD }),
        ...(defaultQuality !== undefined && { defaultQuality }),
      },
    });

    if (Array.isArray(packIds)) {
      await prisma.packChannel.deleteMany({ where: { channelId: id } });
      if (packIds.length > 0) {
        await prisma.packChannel.createMany({
          data: packIds.map((packId: string) => ({ packId, channelId: id })),
        });
      }
    }

    cache.invalidatePattern('channels:');

    return success(res, channel, 'Canal actualizado');
  } catch (err: any) {
    console.error('[UPDATE CHANNEL ERROR]', err.message);
    return error(res, 'Error al actualizar canal: ' + err.message, 500);
  }
}

export async function deleteChannel(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const activityCount = await prisma.activityLog.count({ where: { channelId: id } });

    if (activityCount > 0) {
      await prisma.channel.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await prisma.channel.delete({ where: { id } });
    }

    cache.invalidatePattern('channels:');

    return success(res, null, 'Canal eliminado');
  } catch (err) {
    return error(res, 'Error al eliminar canal', 500);
  }
}

export async function toggleChannel(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) {
      return error(res, 'Canal no encontrado', 404);
    }

    const updated = await prisma.channel.update({
      where: { id },
      data: { isActive: !channel.isActive },
    });

    cache.invalidatePattern('channels:');

    return success(res, updated, updated.isActive ? 'Canal activado' : 'Canal desactivado');
  } catch (err) {
    return error(res, 'Error al cambiar estado', 500);
  }
}

export async function reorderChannels(req: Request, res: Response) {
  try {
    const { channels } = req.body as { channels: { id: string; sortOrder: number }[] };

    await prisma.$transaction(
      channels.map((ch) =>
        prisma.channel.update({
          where: { id: ch.id },
          data: { sortOrder: ch.sortOrder },
        })
      )
    );

    cache.invalidatePattern('channels:');

    return success(res, null, 'Canales reordenados');
  } catch (err) {
    return error(res, 'Error al reordenar', 500);
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.channel.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return success(res, categories.map((c) => c.category));
  } catch (err) {
    return error(res, 'Error al obtener categorías', 500);
  }
}

export async function importM3u(req: Request, res: Response) {
  try {
    const { content } = req.body as { content: string };

    if (!content || typeof content !== 'string') {
      return error(res, 'Contenido M3U requerido', 400);
    }

    const lines = content.split('\n');
    const channels: any[] = [];

    let currentChannel: any = null;
    let groupTitle = 'General';
    let currentNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        const attrsMatch = line.match(/tvg-logo="([^"]*)"/);
        const nameMatch = line.match(/,(.+)$/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const adultMatch = line.includes('tvg-type="adult"') || line.includes('tvg-type="Adult"');

        const logoUrl = attrsMatch ? attrsMatch[1] : null;
        const name = nameMatch ? nameMatch[1].trim() : null;
        groupTitle = groupMatch ? groupMatch[1] : 'General';

        if (name) {
          currentChannel = {
            name,
            logoUrl: logoUrl || null,
            category: groupTitle,
            isAdult: adultMatch || groupTitle.toLowerCase().includes('adult'),
          };
        }
      } else if (line && !line.startsWith('#') && line.startsWith('http')) {
        if (currentChannel) {
          const quality = line.includes('.m3u8') ? 'HD' : 'SD';
          channels.push({
            ...currentChannel,
            streamUrl: line,
            quality,
            isActive: true,
          });
          currentChannel = null;
        }
      }
    }

    const maxOrder = await prisma.channel.aggregate({ _max: { sortOrder: true } });
    let sortOrder = (maxOrder._max.sortOrder || 0) + 1;

    const existingChannels = await prisma.channel.findMany({
      where: { number: { in: channels.map((_, idx) => currentNumber + idx) } },
      select: { number: true },
    });
    const existingNumbers = new Set(existingChannels.map((c) => c.number));

    const toCreate: any[] = [];
    let num = currentNumber;

    for (const ch of channels) {
      while (existingNumbers.has(num)) {
        num++;
      }
      toCreate.push({
        number: num,
        name: ch.name,
        logoUrl: ch.logoUrl,
        streamUrl: ch.streamUrl,
        streamUrlBackup: null,
        category: ch.category,
        isAdult: ch.isAdult,
        quality: ch.quality,
        sortOrder: sortOrder++,
        isActive: true,
      });
      num++;
    }

    if (toCreate.length === 0) {
      return success(res, { imported: 0 }, 'No se encontraron canales nuevos para importar');
    }

    await prisma.channel.createMany({ data: toCreate });

    cache.invalidatePattern('channels:');

    return success(res, { imported: toCreate.length }, `${toCreate.length} canales importados`);
  } catch (err) {
    console.error('M3U import error:', err);
    return error(res, 'Error al importar M3U', 500);
  }
}

export async function bulkDeleteChannels(req: Request, res: Response) {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'Se requiere un array de IDs', 400);
    }

    await prisma.channel.deleteMany({
      where: { id: { in: ids } },
    });

    cache.invalidatePattern('channels:');

    return success(res, { deleted: ids.length }, `${ids.length} canales eliminados`);
  } catch (err: any) {
    console.error('Bulk delete error:', err?.message || err);
    if (err?.code === 'P2003') {
      return error(res, 'No se puede eliminar: el canal tiene relaciones activas', 400);
    }
    return error(res, 'Error al eliminar canales', 500);
  }
}
