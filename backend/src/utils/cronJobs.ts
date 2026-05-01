import cron from 'node-cron';
import prisma from '../config/database';

export function startCronJobs() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const expiredCodes = await prisma.pairingCode.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      if (expiredCodes.count > 0) {
        console.log(`[CRON] Marcados ${expiredCodes.count} códigos de emparejamiento como EXPIRED`);
      }
    } catch (err) {
      console.error('[CRON] Error en job de códigos expirados:', err);
    }
  });

  let lastMonitorRun = 0;

  setInterval(async () => {
    try {
      const config = await prisma.monitorConfig.findFirst();
      const intervalMs = (config?.intervalMinutes || 5) * 60 * 1000;
      const now = Date.now();

      if (now - lastMonitorRun >= intervalMs) {
        lastMonitorRun = now;
        const { runMonitorCycle } = await import('../modules/monitor/monitor.service');
        await runMonitorCycle();
      }
    } catch (err) {
      console.error('[MONITOR] Error en ciclo de monitoreo:', err);
    }
  }, 30000);

  console.log('[CRON] Monitor corriendo con intervalo configurable');

  cron.schedule('0 10 * * *', async () => {
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiringUsers = await prisma.user.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          expiresAt: {
            gte: now,
            lte: in7Days,
          },
        },
      });

      for (const user of expiringUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Tu suscripción vence pronto',
            message: `Tu suscripción vence el ${user.expiresAt?.toLocaleDateString()}. Contacta al administrador para renovar.`,
            type: 'WARNING',
          },
        });
      }

      console.log(`[CRON] Evaluando ${expiringUsers.length} usuarios con vencimiento próximo`);
    } catch (err) {
      console.error('[CRON] Error en job de vencimiento próximo:', err);
    }
  });

  cron.schedule('0 10 * * *', async () => {
    try {
      const now = new Date();

      const expiredUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: now },
        },
      });

      for (const user of expiredUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'EXPIRED' },
        });

        await prisma.session.deleteMany({
          where: { userId: user.id },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Tu suscripción ha vencido',
            message: 'Tu suscripción ha vencido. Contacta al administrador para renovar.',
            type: 'DANGER',
          },
        });
      }

      console.log(`[CRON] Marcados ${expiredUsers.length} usuarios como EXPIRED`);
    } catch (err) {
      console.error('[CRON] Error en job de usuarios vencidos:', err);
    }
  });

  console.log('[CRON] Tareas programadas iniciadas');
}