import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import authPairingRoutes from './modules/auth/pairing.routes';
import adminAuthRoutes from './modules/admin/auth/adminAuth.routes';
import channelsRoutes from './modules/channels/channels.routes';
import adminChannelsRoutes from './modules/admin/channels/adminChannels.routes';
import adminPacksRoutes from './modules/admin/packs/adminPacks.routes';
import userPacksRoutes from './modules/admin/users/userPacks.routes';
import adminUsersRoutes from './modules/admin/users/adminUsers.routes';
import adminPairingRoutes from './modules/admin/pairing/pairing.routes';
import metricsRoutes from './modules/admin/metrics/metrics.routes';
import sessionsRoutes from './modules/admin/sessions/sessions.routes';
import monitorRoutes from './modules/monitor/monitor.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminNotificationsRoutes from './modules/admin/notifications/adminNotifications.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import proxyRoutes from './modules/proxy/proxy.routes';
import { startCronJobs } from './utils/cronJobs';
import { authenticateAdmin } from './middlewares/authenticateAdmin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3002;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    project: 'IPTV DevByte'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', authPairingRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/admin/channels', adminChannelsRoutes);
app.use('/api/admin/packs', adminPacksRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/users', userPacksRoutes);
app.use('/api/admin/pairing', adminPairingRoutes);
app.use('/api/admin/metrics', metricsRoutes);
app.use('/api/admin/sessions', sessionsRoutes);
app.use('/api/admin/monitor', monitorRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/proxy', proxyRoutes);

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.of('/admin-socket').use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token no proporcionado'));
  next();
});

io.of('/admin-socket').on('connection', (socket) => {
  console.log('[SOCKET] Admin conectado');

  const sendSessionsUpdate = async () => {
    const { default: prisma } = await import('./config/database');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sessions = await prisma.session.findMany({
      where: { lastSeen: { gte: fiveMinutesAgo } },
      include: {
        user: { select: { username: true, fullName: true } },
        channel: { select: { name: true } },
      },
    });
    socket.emit('sessions:update', sessions);
  };

  sendSessionsUpdate();
  const interval = setInterval(sendSessionsUpdate, 30000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('[SOCKET] Admin desconectado');
  });
});

startCronJobs();

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP corriendo en puerto ${PORT} (accessible en red local)`);
});

const keyPath = path.join(__dirname, '..', 'key.pem');
const certPath = path.join(__dirname, '..', 'cert.pem');

async function startHttpsServer() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const https = require('https');
    const httpsServer = https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }, app);

    const ioSecure = new SocketServer(httpsServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    ioSecure.of('/admin-socket').use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token no proporcionado'));
      next();
    });

    ioSecure.of('/admin-socket').on('connection', (socket) => {
      console.log('[SOCKET-S] Admin conectado');

      const sendSessionsUpdate = async () => {
        const { default: prisma } = await import('./config/database');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const sessions = await prisma.session.findMany({
          where: { lastSeen: { gte: fiveMinutesAgo } },
          include: {
            user: { select: { username: true, fullName: true } },
            channel: { select: { name: true } },
          },
        });
        socket.emit('sessions:update', sessions);
      };

      sendSessionsUpdate();
      const interval = setInterval(sendSessionsUpdate, 30000);

      socket.on('disconnect', () => {
        clearInterval(interval);
        console.log('[SOCKET-S] Admin desconectado');
      });
    });

    httpsServer.listen(Number(HTTPS_PORT), '0.0.0.0', () => {
      console.log(`🔐 Servidor HTTPS corriendo en puerto ${HTTPS_PORT} (accessible en red local)`);
    });
  } else {
    console.log('⚠️  Certificados HTTPS no encontrados (key.pem, cert.pem). Solo HTTP disponible.');
    console.log('   Ejecutá: npm run generate-certs');
  }
}

startHttpsServer();

export default app;
