import { authenticate } from '../utils/jwt.js';

export default async function appointmentRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // List appointments (with optional filters)
  fastify.get('/', async (request) => {
    const { startDate, endDate, status } = request.query;

    const where = {};
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (status) {
      where.status = status;
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
    const { clientId, serviceId, startTime, price, paidAmount, notes } = request.body;

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
        price: price || service.priceCents / 100,
        paidAmount: paidAmount || 0,
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
    const { clientId, serviceId, startTime, price, paidAmount, notes } = request.body;

    const updateData = {};
    
    if (clientId) updateData.clientId = clientId;
    if (notes !== undefined) updateData.notes = notes;
    if (price !== undefined) updateData.price = price;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;

    if (serviceId) {
      updateData.serviceId = serviceId;
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service && startTime) {
        const start = new Date(startTime);
        updateData.startTime = start;
        updateData.endTime = new Date(start.getTime() + service.durationMinutes * 60000);
      }
    } else if (startTime) {
      updateData.startTime = new Date(startTime);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    if (!['PENDENTE', 'PREPAGO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(status)) {
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

    // Create status change notification
    await prisma.notification.create({
      data: {
        appointmentId: id,
        type: 'status_change',
        channel: 'push',
        payload: { oldStatus: appointment.status, newStatus: status },
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
