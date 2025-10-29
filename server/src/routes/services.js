import { authenticate } from '../utils/jwt.js';

export default async function serviceRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // List services
  fastify.get('/', async () => {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return { services };
  });

  // Create service
  fastify.post('/', async (request, reply) => {
    const { name, priceCents, durationMinutes, color } = request.body;

    if (!name || priceCents == null || !durationMinutes) {
      return reply.code(400).send({ error: 'Dados inválidos' });
    }

    const service = await prisma.service.create({
      data: { name, priceCents, durationMinutes, color },
    });

    return { service };
  });

  // Update service
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, priceCents, durationMinutes, color } = request.body;

    const service = await prisma.service.update({
      where: { id },
      data: { name, priceCents, durationMinutes, color },
    });

    return { service };
  });

  // Delete service
  fastify.delete('/:id', async (request) => {
    const { id } = request.params;

    await prisma.service.delete({ where: { id } });

    return { success: true };
  });
}
