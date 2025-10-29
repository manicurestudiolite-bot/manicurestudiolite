# 🏗️ Estrutura do Backend - Manicure Studio Lite

Este documento descreve a estrutura completa do backend Node.js + Fastify + Prisma que você deve criar separadamente para integrar com o frontend PWA.

## 📁 Estrutura de Diretórios

```
/server
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── cors.ts
│   ├── plugins/
│   │   ├── auth.ts
│   │   └── prisma.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── services.ts
│   │   ├── products.ts
│   │   ├── appointments.ts
│   │   ├── push.ts
│   │   ├── settings.ts
│   │   └── reports.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── push.service.ts
│   │   └── cron.service.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── validators.ts
│   └── types/
│       └── index.ts
├── dist/ (gerado após build)
├── package.json
├── tsconfig.json
└── .env.example
```

## 🗄️ Schema Prisma Completo

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String    @map("password_hash")
  createdAt    DateTime  @default(now()) @map("created_at")

  appointments     Appointment[]
  pushSubscriptions PushSubscription[]
  settings         UserSettings?

  @@map("users")
}

model Client {
  id        String   @id @default(uuid())
  name      String
  phone     String
  instagram String?
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")

  appointments Appointment[]

  @@map("clients")
}

model Service {
  id              String   @id @default(uuid())
  name            String
  priceCents      Int      @map("price_cents")
  durationMinutes Int      @map("duration_minutes")
  color           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  appointments Appointment[]

  @@map("services")
}

model Product {
  id            String   @id @default(uuid())
  name          String
  brand         String?
  color         String?
  qty           Int
  lowStockLimit Int      @map("low_stock_limit")
  priceCents    Int?     @map("price_cents")
  createdAt     DateTime @default(now()) @map("created_at")

  stockMoves StockMove[]

  @@map("products")
}

model StockMove {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  delta     Int
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("stock_moves")
}

enum AppointmentStatus {
  PENDENTE
  CONCLUIDO
  ANTECIPADO
}

model Appointment {
  id        String            @id @default(uuid())
  userId    String?           @map("user_id")
  clientId  String            @map("client_id")
  serviceId String            @map("service_id")
  startTime DateTime          @map("start_time")
  status    AppointmentStatus @default(PENDENTE)
  notes     String?
  createdAt DateTime          @default(now()) @map("created_at")

  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  client  Client  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  @@index([startTime])
  @@index([status])
  @@map("appointments")
}

model PushSubscription {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}

enum Theme {
  light
  dark
  system
}

model UserSettings {
  userId   String  @id @map("user_id")
  notif24h Boolean @default(true) @map("notif_24h")
  notif3h  Boolean @default(true) @map("notif_3h")
  notif1h  Boolean @default(true) @map("notif_1h")
  theme    Theme   @default(system)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

## 🔧 Configuração Principal (src/index.ts)

```typescript
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { config } from './config/env';
import { setupCron } from './services/cron.service';

// Routes
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import serviceRoutes from './routes/services';
import productRoutes from './routes/products';
import appointmentRoutes from './routes/appointments';
import pushRoutes from './routes/push';
import settingsRoutes from './routes/settings';
import reportRoutes from './routes/reports';

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
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../web/dist'),
  prefix: '/',
});

// Prisma decorator
fastify.decorate('prisma', prisma);

// Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(clientRoutes, { prefix: '/api/clients' });
fastify.register(serviceRoutes, { prefix: '/api/services' });
fastify.register(productRoutes, { prefix: '/api/products' });
fastify.register(appointmentRoutes, { prefix: '/api/appointments' });
fastify.register(pushRoutes, { prefix: '/api/push' });
fastify.register(settingsRoutes, { prefix: '/api/settings' });
fastify.register(reportRoutes, { prefix: '/api/reports' });

// Health check
fastify.get('/api/health', async () => ({ status: 'ok' }));

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
    setupCron(prisma);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

## 🔐 Autenticação (src/routes/auth.ts - Exemplo)

```typescript
import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken, signRefreshToken } from '../utils/jwt';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = fastify.prisma;

  // Register
  fastify.post('/register', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(255),
      password: z.string().min(6).max(100),
    });

    try {
      const { name, email, password } = schema.parse(request.body);

      // Check if user exists
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return reply.code(400).send({ error: 'Email já cadastrado' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      // Create default settings
      await prisma.userSettings.create({
        data: { userId: user.id },
      });

      // Generate tokens
      const accessToken = signToken({ userId: user.id });
      const refreshToken = signRefreshToken({ userId: user.id });

      // Set cookies
      reply
        .setCookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 min
        })
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

      return { user };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
      }
      throw error;
    }
  });

  // Login (similar structure)
  // Logout
  // Refresh
  // Me (get current user)
};

export default authRoutes;
```

## 🔔 Push Notifications (src/services/cron.service.ts - Exemplo)

```typescript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { config } from '../config/env';
import { subHours, addMinutes } from 'date-fns';

webpush.setVapidDetails(
  `mailto:${config.supportEmail}`,
  config.vapidPublicKey,
  config.vapidPrivateKey
);

export const setupCron = (prisma: PrismaClient) => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔔 Checking for appointment reminders...');

    const now = new Date();
    const windows = [
      { hours: 24, key: 'notif24h' as const },
      { hours: 3, key: 'notif3h' as const },
      { hours: 1, key: 'notif1h' as const },
    ];

    for (const window of windows) {
      const targetTime = subHours(now, window.hours);
      const rangeStart = addMinutes(targetTime, -10);
      const rangeEnd = addMinutes(targetTime, 10);

      // Find appointments in window
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'PENDENTE',
          startTime: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        include: {
          client: true,
          service: true,
          user: {
            include: {
              settings: true,
              pushSubscriptions: true,
            },
          },
        },
      });

      for (const apt of appointments) {
        if (!apt.user?.settings?.[window.key]) continue;

        const subscriptions = apt.user.pushSubscriptions || [];

        const payload = JSON.stringify({
          title: 'Lembrete de Agendamento',
          body: `${apt.client.name} - ${apt.service.name} às ${apt.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          data: { url: '/agenda' },
        });

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload
            );
          } catch (error: any) {
            if (error?.statusCode === 410) {
              // Subscription expired, remove it
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } else {
              console.error('Push error:', error);
            }
          }
        }
      }
    }
  });

  console.log('✅ Cron jobs initialized');
};
```

## 📦 package.json (Backend)

```json
{
  "name": "mslite-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@fastify/cookie": "^9.0.0",
    "@fastify/cors": "^8.0.0",
    "@fastify/static": "^6.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "date-fns": "^3.0.0",
    "fastify": "^4.0.0",
    "jsonwebtoken": "^9.0.0",
    "node-cron": "^3.0.0",
    "web-push": "^3.6.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.0",
    "@types/web-push": "^3.6.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🔑 Variáveis de Ambiente (.env.example)

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://mslite:SENHA@127.0.0.1:5432/mslite

JWT_SECRET=gere_secret_aleatorio_forte
JWT_REFRESH_SECRET=gere_outro_secret_aleatorio_forte

WEB_ORIGIN=https://app.seudominio.com

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

SUPPORT_EMAIL=manicurestudiolite@gmail.com
```

## ✅ Próximos Passos

1. Crie a pasta `/server` no projeto
2. Implemente todos os arquivos listados acima
3. Complete as rotas faltantes (clients, services, products, etc.) seguindo o padrão de auth
4. Teste localmente com `npm run dev`
5. Build e deploy conforme `DEPLOYMENT.md`

Este backend é totalmente independente do Lovable e roda no seu VPS. O frontend PWA criado no Lovable fará requisições HTTP para este backend.
