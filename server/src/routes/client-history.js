import { authenticate } from '../utils/jwt.js';

export default async function clientHistoryRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // Get client history
  fastify.get('/:id/history', async (request) => {
    const { id } = request.params;

    const history = await prisma.serviceHistory.findMany({
      where: { clientId: id },
      include: { service: true },
      orderBy: { date: 'desc' },
    });

    return { history };
  });
}
