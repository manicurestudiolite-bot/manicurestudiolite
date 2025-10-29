import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { setupCron } from './services/cron.service.js';

import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import serviceRoutes from './routes/services.js';
import productRoutes from './routes/products.js';
import appointmentRoutes from './routes/appointments.js';
import pushRoutes from './routes/push.js';
import settingsRoutes from './routes/settings.js';
import reportRoutes from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// CORS
fastify.register(fastifyCors, {
  origin: config.webOrigin,
  credentials: true,
});

// Cookies
fastify.register(fastifyCookie, {
  secret: config.jwtSecret,
});

// Serve static files (SPA)
const webDistPath = path.join(__dirname, '../../web/dist');
fastify.register(fastifyStatic, {
  root: webDistPath,
  prefix: '/',
});

// Prisma decorator
fastify.decorate('prisma', prisma);

// API Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(clientRoutes, { prefix: '/api/clients' });
fastify.register(serviceRoutes, { prefix: '/api/services' });
fastify.register(productRoutes, { prefix: '/api/products' });
fastify.register(appointmentRoutes, { prefix: '/api/appointments' });
fastify.register(pushRoutes, { prefix: '/api/push' });
fastify.register(settingsRoutes, { prefix: '/api/settings' });
fastify.register(reportRoutes, { prefix: '/api/reports' });

// Health check
fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// SPA fallback
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Not Found' });
  } else {
    reply.sendFile('index.html');
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${config.port}`);

    // Setup cron jobs
    if (config.vapidPublicKey && config.vapidPrivateKey) {
      setupCron(prisma);
    } else {
      console.warn('⚠️ VAPID keys not configured, push notifications disabled');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
