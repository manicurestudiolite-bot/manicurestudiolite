import { authenticate } from '../utils/jwt.js';

export default async function appointmentRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // List appointments (with optional date filter)
  fastify.get('/', async (request) => {
    const { startDate, endDate } = request.query;

    const where = {};
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return { appointments };
  });

  // Create appointment
  fastify.post('/', async (request, reply) => {
    const { clientId, serviceId, startTime, notes } = request.body;

    if (!clientId || !serviceId || !startTime) {
      return reply.code(400).send({ error: 'Dados inválidos' });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return reply.code(404).send({ error: 'Serviço não encontrado' });
    }

    const start = new Date(startTime);
    const endTime = new Date(start.getTime() + service.durationMinutes * 60000);

    const appointment = await prisma.appointment.create({
      data: {
        userId: request.userId,
        clientId,
        serviceId,
        startTime: start,
        endTime,
        notes,
      },
      include: {
        client: true,
        service: true,
      },
    });

    return { appointment };
  });

  // Update appointment
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { clientId, serviceId, startTime, notes } = request.body;

    let endTime;
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service && startTime) {
        const start = new Date(startTime);
        endTime = new Date(start.getTime() + service.durationMinutes * 60000);
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        clientId,
        serviceId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime,
        notes,
      },
      include: {
        client: true,
        service: true,
      },
    });

    return { appointment };
  });

  // Update appointment status
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    if (!['PENDENTE', 'CONCLUIDO', 'ANTECIPADO'].includes(status)) {
      return reply.code(400).send({ error: 'Status inválido' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        service: true,
      },
    });

    return { appointment };
  });

  // Delete appointment
  fastify.delete('/:id', async (request) => {
    const { id } = request.params;

    await prisma.appointment.delete({ where: { id } });

    return { success: true };
  });
}
