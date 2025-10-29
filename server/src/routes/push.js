import { authenticate } from '../utils/jwt.js';

export default async function pushRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // Subscribe to push notifications
  fastify.post('/subscribe', async (request, reply) => {
    const { endpoint, keys } = request.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return reply.code(400).send({ error: 'Dados inválidos' });
    }

    // Check if already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      return { subscription: existing };
    }

    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: request.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return { subscription };
  });

  // Unsubscribe from push notifications
  fastify.post('/unsubscribe', async (request, reply) => {
    const { endpoint } = request.body;

    if (!endpoint) {
      return reply.code(400).send({ error: 'Endpoint obrigatório' });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return { success: true };
  });

  // Get VAPID public key
  fastify.get('/vapid-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  });
}
