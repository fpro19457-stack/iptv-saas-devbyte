import { Request, Response } from 'express';
import prisma from '../../config/database';
import { success, error } from '../../utils/response';

interface AuthRequest extends Request {
  user?: { id: string; username: string; status: string };
  sessionId?: string;
}

export async function listChannels(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const userPacks = await prisma.userPack.findMany({
      where: { userId },
      include: {
        pack: {
          include: {
            packChannels: {
              include: {
                channel: true,
              },
            },
          },
        },
      },
    });

    const hasAdultPack = userPacks.some((up) => {
      const channelIds = up.pack.packChannels.map((pc) => pc.channelId);
      return channelIds.length > 0;
    });

    const channelMap = new Map<string, any>();

    for (const up of userPacks) {
      for (const pc of up.pack.packChannels) {
        const channel = pc.channel;
        if (!channel.isActive) continue;
        if (channel.isAdult && !hasAdultPack) continue;
        if (!channelMap.has(channel.id)) {
          channelMap.set(channel.id, {
            id: channel.id,
            number: channel.number,
            name: channel.name,
            logoUrl: channel.logoUrl,
            category: channel.category,
            isAdult: channel.isAdult,
            quality: channel.quality,
            sortOrder: channel.sortOrder,
          });
        }
      }
    }

    const channels = Array.from(channelMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

    return success(res, channels);
  } catch (err) {
    return error(res, 'Error al obtener canales', 500);
  }
}

export async function getStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const channelId = req.params.id;

    const userPacks = await prisma.userPack.findMany({
      where: { userId },
      include: {
        pack: {
          include: {
            packChannels: true,
          },
        },
      },
    });

    const packChannelIds = userPacks.flatMap((up) => up.pack.packChannels.map((pc) => pc.channelId));

    const hasAccess = packChannelIds.includes(channelId);

    if (!hasAccess) {
      return error(res, 'No tienes acceso a este canal', 403);
    }

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });

    if (!channel || !channel.isActive) {
      return error(res, 'Canal no disponible', 404);
    }

    if (channel.isAdult) {
      const hasAdultPack = userPacks.some((up) => {
        const channelIds = up.pack.packChannels.map((pc) => pc.channelId);
        return channelIds.some((cid) => {
          return channelIds.includes(cid);
        });
      });

      if (!hasAdultPack) {
        return error(res, 'No tienes acceso a este canal', 403);
      }
    }

    await prisma.session.update({
      where: { id: req.sessionId },
      data: { currentChannelId: channelId },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        channelId,
        action: 'WATCH',
        ipAddress: req.ip || '0.0.0.0',
      },
    });

    return success(res, {
      streamUrl: channel.streamUrl,
      streamUrlBackup: channel.streamUrlBackup,
      name: channel.name,
      quality: channel.quality,
      qualities: {
        SD: channel.streamUrlSD || null,
        HD: channel.streamUrlHD || null,
        FHD: channel.streamUrlFHD || null,
      },
      defaultQuality: channel.defaultQuality,
    });
  } catch (err) {
    return error(res, 'Error al obtener stream', 500);
  }
}
