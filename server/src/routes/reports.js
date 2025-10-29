import { authenticate } from '../utils/jwt.js';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export default async function reportRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // Revenue report
  fastify.get('/revenue', async (request, reply) => {
    try {
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

      const totalCents = appointments.reduce((sum, apt) => {
        const price = apt.paidAmount || apt.price || 0;
        return sum + Math.round(price * 100);
      }, 0);

      return {
        totalCents,
        count: appointments.length,
        appointments,
      };
    } catch (err) {
      console.error('Error in /revenue:', err);
      reply.status(500).send({ error: 'Failed to fetch revenue data' });
    }
  });

  // Top services
  fastify.get('/top-services', async (request, reply) => {
    try {
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
        const price = apt.paidAmount || apt.price || 0;
        serviceMap[key].totalCents += Math.round(price * 100);
      });

      const topServices = Object.values(serviceMap).sort((a, b) => b.totalCents - a.totalCents);

      return { topServices };
    } catch (err) {
      console.error('Error in /top-services:', err);
      reply.status(500).send({ error: 'Failed to fetch top services' });
    }
  });

  // Top clients
  fastify.get('/top-clients', async (request, reply) => {
    try {
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
        const price = apt.paidAmount || apt.price || 0;
        clientMap[key].totalCents += Math.round(price * 100);
      });

      const topClients = Object.values(clientMap).sort((a, b) => b.totalCents - a.totalCents);

      return { topClients };
    } catch (err) {
      console.error('Error in /top-clients:', err);
      reply.status(500).send({ error: 'Failed to fetch top clients' });
    }
  });

  // Low stock products
  fastify.get('/low-stock', async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          qty: {
            lte: prisma.raw('low_stock_limit'),
          },
        },
        orderBy: { qty: 'asc' },
      });

      return { products };
    } catch (err) {
      console.error('Error in /low-stock:', err);
      reply.status(500).send({ error: 'Failed to fetch low stock products' });
    }
  });
}
