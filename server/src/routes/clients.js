import { authenticate } from '../utils/jwt.js';

export default async function clientRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // List clients
  fastify.get('/', async (request) => {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    });
    return { clients };
  });

  // Create client
  fastify.post('/', async (request, reply) => {
    const { name, phone, instagram, notes } = request.body;

    if (!name || !phone) {
      return reply.code(400).send({ error: 'Nome e telefone são obrigatórios' });
    }

    const client = await prisma.client.create({
      data: { name, phone, instagram, notes },
    });

    return { client };
  });

  // Update client
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, phone, instagram, notes } = request.body;

    const client = await prisma.client.update({
      where: { id },
      data: { name, phone, instagram, notes },
    });

    return { client };
  });

  // Delete client
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.client.delete({ where: { id } });

    return { success: true };
  });
}
