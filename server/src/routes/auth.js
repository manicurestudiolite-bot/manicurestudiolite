import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken, verifyRefreshToken, authenticate } from '../utils/jwt.js';

export default async function authRoutes(fastify) {
  const prisma = fastify.prisma;

  // Register
  fastify.post('/register', async (request, reply) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Dados inválidos' });
    }

    if (password.length < 6) {
      return reply.code(400).send({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return reply.code(400).send({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    await prisma.userSettings.create({ data: { userId: user.id } });

    const accessToken = signToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    return { user };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Credenciais inválidas' });
    }

    const accessToken = signToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('accessToken').clearCookie('refreshToken');
    return { success: true };
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies.refreshToken;
    if (!token) {
      return reply.code(401).send({ error: 'Token não fornecido' });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return reply.code(401).send({ error: 'Token inválido' });
    }

    const accessToken = signToken({ userId: payload.userId });

    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { success: true };
  });

  // Get current user
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }

    return { user };
  });
}
