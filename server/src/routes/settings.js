import { authenticate } from '../utils/jwt.js';

export default async function settingsRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // Get user settings
  fastify.get('/me', async (request) => {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: request.userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: request.userId },
      });
    }

    return { settings };
  });

  // Update user settings
  fastify.put('/me', async (request, reply) => {
    const { notif24h, notif3h, notif1h, theme } = request.body;

    const data = {};
    if (notif24h !== undefined) data.notif24h = notif24h;
    if (notif3h !== undefined) data.notif3h = notif3h;
    if (notif1h !== undefined) data.notif1h = notif1h;
    if (theme && ['light', 'dark', 'system'].includes(theme)) data.theme = theme;

    const settings = await prisma.userSettings.upsert({
      where: { userId: request.userId },
      update: data,
      create: { userId: request.userId, ...data },
    });

    return { settings };
  });
}
