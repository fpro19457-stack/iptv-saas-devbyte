import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { success, error } from '../../../utils/response';

export async function getMetrics(req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeCount, suspendedCount, trialCount, expiredCount, totalUsers] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'TRIAL' } }),
      prisma.user.count({ where: { status: 'EXPIRED' } }),
      prisma.user.count(),
    ]);

    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await prisma.session.count({
      where: { lastSeen: { gte: fiveMinutesAgo } },
    });

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const popularChannels = await prisma.activityLog.groupBy({
      by: ['channelId'],
      where: { createdAt: { gte: startOfDay } },
      _count: { channelId: true },
      orderBy: { _count: { channelId: 'desc' } },
      take: 5,
    });

    const channelIds = popularChannels.map((pc) => pc.channelId).filter((id): id is string => id !== null);
    const channels = await prisma.channel.findMany({
      where: { id: { in: channelIds } },
    });

    const channelsWithViews = popularChannels.map((pc) => {
      const channel = channels.find((c) => c.id === pc.channelId);
      return {
        channel,
        viewCount: pc._count.channelId,
      };
    }).filter((item) => item.channel != null);

    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { username: true, fullName: true } },
        channel: { select: { name: true, logoUrl: true } },
      },
    });

    const total = activeCount + suspendedCount + trialCount + expiredCount;
    const distributionByStatus = {
      active: total > 0 ? Math.round((activeCount / total) * 100) : 0,
      suspended: total > 0 ? Math.round((suspendedCount / total) * 100) : 0,
      trial: total > 0 ? Math.round((trialCount / total) * 100) : 0,
      expired: total > 0 ? Math.round((expiredCount / total) * 100) : 0,
    };

    return success(res, {
      totalUsers: {
        active: activeCount,
        suspended: suspendedCount,
        trial: trialCount,
        expired: expiredCount,
      },
      newUsersThisMonth,
      activeSessions,
      popularChannels: channelsWithViews,
      distributionByStatus,
      recentActivity,
    });
  } catch (err) {
    return error(res, 'Error al obtener métricas', 500);
  }
}
