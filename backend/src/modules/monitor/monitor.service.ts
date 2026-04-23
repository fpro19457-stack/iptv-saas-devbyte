import prisma from '../../config/database';
import { cache } from '../../utils/cache';

declare const require: any;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function checkChannel(channel: any): Promise<{
  isUp: boolean;
  responseCode?: number;
  responseTimeMs?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(channel.streamUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        isUp: false,
        responseCode: response.status,
        responseTimeMs,
        error: `HTTP ${response.status}`,
      };
    }

    const isM3U8 = channel.streamUrl.includes('.m3u8');
    if (isM3U8) {
      const text = await response.text();
      if (!text.includes('#EXTM3U')) {
        return {
          isUp: false,
          responseCode: response.status,
          responseTimeMs,
          error: 'Invalid m3u8 stream',
        };
      }
    }

    return { isUp: true, responseCode: response.status, responseTimeMs };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      return {
        isUp: false,
        responseTimeMs,
        error: 'Timeout (>10s)',
      };
    }

    return {
      isUp: false,
      responseTimeMs,
      error: err.message || 'Connection failed',
    };
  }
}

async function sendEmailAlert(subject: string, html: string) {
  if (!transporter.options.auth?.user) return;

  const config = await prisma.monitorConfig.findFirst();
  if (!config || !config.emailAlerts || config.emailAlerts.length === 0) return;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: config.emailAlerts,
      subject,
      html,
    });
    console.log(`[MONITOR] Email alert sent: ${subject}`);
  } catch (err) {
    console.error('[MONITOR] Email send failed:', err);
  }
}

async function sendTelegramAlert(message: string) {
  const config = await prisma.monitorConfig.findFirst();
  if (!config?.telegramToken || !config?.telegramChatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    console.log(`[MONITOR] Telegram alert sent`);
  } catch (err) {
    console.error('[MONITOR] Telegram send failed:', err);
  }
}

async function notifyChannelDown(channel: any) {
  const config = await prisma.monitorConfig.findFirst();

  const emailHtml = `
    <h2 style="color: #ef4444;">⚠️ Canal caído</h2>
    <p><strong>Nombre:</strong> ${channel.name}</p>
    <p><strong>Número:</strong> ${channel.number}</p>
    <p><strong>Hora:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>URL:</strong> <code>${channel.streamUrl}</code></p>
    <p><a href="http://${process.env.SERVER_IP || 'localhost'}:5173/admin/monitor">Ver en panel admin</a></p>
  `;

  await sendEmailAlert(`⚠️ Canal caído: ${channel.name}`, emailHtml);

  const telegramMsg = `🔴 <b>Canal caído</b>\n📺 ${channel.name}\n⏰ ${new Date().toLocaleTimeString()}\n🔗 ${channel.streamUrl}`;
  await sendTelegramAlert(telegramMsg);
}

async function notifyChannelUp(channel: any, durationMinutes: number) {
  const emailHtml = `
    <h2 style="color: #10b981;">✅ Canal recuperado</h2>
    <p><strong>Nombre:</strong> ${channel.name}</p>
    <p><strong>Duración:</strong> ${durationMinutes} minutos caído</p>
    <p><strong>Hora:</strong> ${new Date().toLocaleString()}</p>
  `;

  await sendEmailAlert(`✅ Canal recuperado: ${channel.name}`, emailHtml);

  const telegramMsg = `🟢 <b>Canal recuperado</b>\n📺 ${channel.name}\n⏱️ Caído por: ${durationMinutes} min`;
  await sendTelegramAlert(telegramMsg);
}

export async function runMonitorCycle() {
  console.log('[MONITOR] Starting cycle...');

  let config = await prisma.monitorConfig.findFirst();
  if (!config) {
    config = await prisma.monitorConfig.create({
      data: {
        intervalMinutes: 5,
        failThreshold: 3,
        emailAlerts: [],
      },
    });
  }

  const channels = await prisma.channel.findMany({
    where: { isActive: true },
  });

  let upCount = 0;
  let downCount = 0;
  let totalResponseTime = 0;
  let responseCount = 0;

  for (const channel of channels) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await checkChannel(channel);

    await prisma.channelCheck.create({
      data: {
        channelId: channel.id,
        status: result.isUp ? 'UP' : result.error?.includes('Timeout') ? 'TIMEOUT' : 'DOWN',
        responseCode: result.responseCode,
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.error,
      },
    });

    if (result.responseTimeMs) {
      totalResponseTime += result.responseTimeMs;
      responseCount++;
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastCheck: new Date() },
    });

    if (result.isUp) {
      upCount++;
      if (channel.isDown) {
        const incident = await prisma.channelIncident.findFirst({
          where: { channelId: channel.id, resolvedAt: null },
        });

        if (incident) {
          const duration = Math.floor((Date.now() - incident.startedAt.getTime()) / 60000);
          await prisma.channelIncident.update({
            where: { id: incident.id },
            data: { resolvedAt: new Date(), duration },
          });

          await notifyChannelUp(channel, duration);
        }

        await prisma.channel.update({
          where: { id: channel.id },
          data: { isDown: false, isActive: true, failCount: 0 },
        });

        cache.invalidatePattern('channels:');

        console.log(`[MONITOR] Channel UP: ${channel.name}`);
      } else {
        await prisma.channel.update({
          where: { id: channel.id },
          data: { failCount: 0 },
        });
      }
    } else {
      downCount++;
      const newFailCount = channel.failCount + 1;

      await prisma.channel.update({
        where: { id: channel.id },
        data: { failCount: newFailCount },
      });

if (newFailCount >= config.failThreshold && !channel.isDown) {
        await prisma.channel.update({
          where: { id: channel.id },
          data: { isDown: true, isActive: false },
        });

        cache.invalidatePattern('channels:');

        await notifyChannelDown(channel);
        console.log(`[MONITOR] Channel DOWN: ${channel.name} (${newFailCount} failures)`);
      }
    }
  }

  console.log(`[MONITOR] Cycle complete: ${upCount} up, ${downCount} down, avg response: ${responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0}ms`);

  return { upCount, downCount, avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0 };
}

export async function getMonitorStatus() {
  const channels = await prisma.channel.findMany({
    include: {
      checks: {
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
      incidents: {
        where: { resolvedAt: null },
        take: 1,
      },
    },
  });

  const activeCount = channels.filter(c => !c.isDown).length;
  const downCount = channels.filter(c => c.isDown).length;

  const recentChecks = await prisma.channelCheck.findMany({
    where: {
      checkedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const avgResponseTime = recentChecks.length > 0
    ? Math.round(recentChecks.reduce((sum, c) => sum + (c.responseTimeMs || 0), 0) / recentChecks.filter(c => c.responseTimeMs).length) || 0
    : 0;

  return {
    channels: channels.map(c => ({
      id: c.id,
      number: c.number,
      name: c.name,
      logoUrl: c.logoUrl,
      isDown: c.isDown,
      failCount: c.failCount,
      lastCheck: c.lastCheck,
      quality: c.quality,
      latestCheck: c.checks[0] || null,
      activeIncident: c.incidents[0] || null,
    })),
    stats: {
      active: activeCount,
      down: downCount,
      avgResponseTime,
    },
  };
}

export async function getIncidents(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [incidents, total] = await Promise.all([
    prisma.channelIncident.findMany({
      include: { channel: { select: { name: true, number: true, logoUrl: true } } },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.channelIncident.count(),
  ]);

  return {
    incidents,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMonitorConfig() {
  let config = await prisma.monitorConfig.findFirst();
  if (!config) {
    config = await prisma.monitorConfig.create({
      data: { intervalMinutes: 5, failThreshold: 3, emailAlerts: [] },
    });
  }
  return config;
}

export async function updateMonitorConfig(data: {
  intervalMinutes?: number;
  failThreshold?: number;
  emailAlerts?: string[];
  telegramToken?: string;
  telegramChatId?: string;
}) {
  const config = await prisma.monitorConfig.findFirst();
  if (!config) {
    return prisma.monitorConfig.create({ data });
  }
  return prisma.monitorConfig.update({
    where: { id: config.id },
    data,
  });
}

export async function checkSingleChannel(channelId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    throw new Error('Channel not found');
  }

  const result = await checkChannel(channel);

  await prisma.channelCheck.create({
    data: {
      channelId: channel.id,
      status: result.isUp ? 'UP' : result.error?.includes('Timeout') ? 'TIMEOUT' : 'DOWN',
      responseCode: result.responseCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.error,
    },
  });

  await prisma.channel.update({
    where: { id: channel.id },
    data: { lastCheck: new Date() },
  });

  return {
    channelId,
    isUp: result.isUp,
    responseCode: result.responseCode,
    responseTimeMs: result.responseTimeMs,
    error: result.error,
  };
}