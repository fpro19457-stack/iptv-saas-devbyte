import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('usuario123', 10);

  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@iptv.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.username);

  const channels = await prisma.channel.createMany({
    data: [
      { number: 1, name: 'CNN', category: 'Noticias', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/CNN.svg/200px-CNN.svg.png' },
      { number: 2, name: 'BBC World', category: 'Noticias', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/CNN.svg/200px-CNN.svg.png' },
      { number: 3, name: 'Telefe Noticias', category: 'Noticias', quality: 'SD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 4, name: 'ESPN', category: 'Deportes', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 5, name: 'TyC Sports', category: 'Deportes', quality: 'FHD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 6, name: 'ESPN 2', category: 'Deportes', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 7, name: 'Sony', category: 'Entretenimiento', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 8, name: 'TCM', category: 'Entretenimiento', quality: 'SD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 9, name: 'HBO', category: 'Entretenimiento', quality: 'FHD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 10, name: 'Playboy TV', category: 'Adultos', quality: 'HD', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', isAdult: true },
    ],
  });
  console.log('✅ Channels created:', channels.count);

  const packBasico = await prisma.pack.create({
    data: {
      name: 'Básico',
      description: 'Canales de noticias',
      color: '#3b82f6',
      icon: 'tv',
    },
  });

  const packFutbol = await prisma.pack.create({
    data: {
      name: 'Fútbol',
      description: 'Canales de deportes',
      color: '#10b981',
      icon: 'trophy',
    },
  });

  const packAdultos = await prisma.pack.create({
    data: {
      name: 'Adultos +18',
      description: 'Contenido para adultos',
      color: '#ef4444',
      icon: 'lock',
    },
  });

  await prisma.packChannel.createMany({
    data: [
      { packId: packBasico.id, channelId: (await prisma.channel.findFirst({ where: { name: 'CNN' } }))!.id },
      { packId: packBasico.id, channelId: (await prisma.channel.findFirst({ where: { name: 'BBC World' } }))!.id },
      { packId: packBasico.id, channelId: (await prisma.channel.findFirst({ where: { name: 'Telefe Noticias' } }))!.id },
      { packId: packFutbol.id, channelId: (await prisma.channel.findFirst({ where: { name: 'ESPN' } }))!.id },
      { packId: packFutbol.id, channelId: (await prisma.channel.findFirst({ where: { name: 'TyC Sports' } }))!.id },
      { packId: packFutbol.id, channelId: (await prisma.channel.findFirst({ where: { name: 'ESPN 2' } }))!.id },
      { packId: packAdultos.id, channelId: (await prisma.channel.findFirst({ where: { name: 'Playboy TV' } }))!.id },
    ],
  });
  console.log('✅ Packs created: Básico, Fútbol, Adultos +18');

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const user1 = await prisma.user.create({
    data: {
      username: 'usuario1',
      fullName: 'Juan Pérez',
      passwordHash: userPassword,
      status: 'ACTIVE',
      expiresAt: in30Days,
      maxDevices: 2,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'usuario2',
      fullName: 'María García',
      passwordHash: userPassword,
      status: 'TRIAL',
      expiresAt: in7Days,
      maxDevices: 2,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'usuario3',
      fullName: 'Carlos López',
      passwordHash: userPassword,
      status: 'SUSPENDED',
      maxDevices: 2,
    },
  });

  await prisma.userPack.createMany({
    data: [
      { userId: user1.id, packId: packBasico.id },
      { userId: user1.id, packId: packFutbol.id },
      { userId: user2.id, packId: packBasico.id },
    ],
  });

  console.log('✅ Users created: usuario1 (ACTIVE), usuario2 (TRIAL), usuario3 (SUSPENDED)');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
