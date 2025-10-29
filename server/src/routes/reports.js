import { authenticate } from '../utils/jwt.js';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export default async function reportRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // Revenue report
  fastify.get('/revenue', async (request) => {
    const { period, startDate, endDate } = request.query;

    let dateFilter = {};
    const now = new Date();

    if (period === 'today') {
      dateFilter = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (period === 'week') {
      dateFilter = { gte: startOfWeek(now), lte: endOfWeek(now) };
    } else if (period === 'month') {
      dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
    } else if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONCLUIDO',
        startTime: dateFilter,
      },
      include: {
        service: true,
      },
    });

    const totalCents = appointments.reduce((sum, apt) => sum + apt.service.priceCents, 0);

    return {
      totalCents,
      count: appointments.length,
      appointments,
    };
  });

  // Top services
  fastify.get('/top-services', async (request) => {
    const { startDate, endDate } = request.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONCLUIDO',
        ...dateFilter,
      },
      include: {
        service: true,
      },
    });

    const serviceMap = {};
    appointments.forEach((apt) => {
      const key = apt.serviceId;
      if (!serviceMap[key]) {
        serviceMap[key] = {
          service: apt.service,
          count: 0,
          totalCents: 0,
        };
      }
      serviceMap[key].count++;
      serviceMap[key].totalCents += apt.service.priceCents;
    });

    const topServices = Object.values(serviceMap).sort((a, b) => b.totalCents - a.totalCents);

    return { topServices };
  });

  // Top clients
  fastify.get('/top-clients', async (request) => {
    const { startDate, endDate } = request.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONCLUIDO',
        ...dateFilter,
      },
      include: {
        client: true,
        service: true,
      },
    });

    const clientMap = {};
    appointments.forEach((apt) => {
      const key = apt.clientId;
      if (!clientMap[key]) {
        clientMap[key] = {
          client: apt.client,
          count: 0,
          totalCents: 0,
        };
      }
      clientMap[key].count++;
      clientMap[key].totalCents += apt.service.priceCents;
    });

    const topClients = Object.values(clientMap).sort((a, b) => b.totalCents - a.totalCents);

    return { topClients };
  });

  // Low stock products
  fastify.get('/low-stock', async () => {
    const products = await prisma.product.findMany({
      where: {
        qty: {
          lte: prisma.raw('low_stock_limit'),
        },
      },
      orderBy: { qty: 'asc' },
    });

    return { products };
  });
}
