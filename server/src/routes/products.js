import { authenticate } from '../utils/jwt.js';

export default async function productRoutes(fastify) {
  const prisma = fastify.prisma;

  fastify.addHook('preHandler', authenticate);

  // List products
  fastify.get('/', async () => {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return { products };
  });

  // Create product
  fastify.post('/', async (request, reply) => {
    const { name, brand, color, qty, lowStockLimit, priceCents } = request.body;

    if (!name || qty == null || lowStockLimit == null) {
      return reply.code(400).send({ error: 'Dados inválidos' });
    }

    const product = await prisma.product.create({
      data: { name, brand, color, qty, lowStockLimit, priceCents },
    });

    return { product };
  });

  // Update product
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, brand, color, qty, lowStockLimit, priceCents } = request.body;

    const product = await prisma.product.update({
      where: { id },
      data: { name, brand, color, qty, lowStockLimit, priceCents },
    });

    return { product };
  });

  // Delete product
  fastify.delete('/:id', async (request) => {
    const { id } = request.params;

    await prisma.product.delete({ where: { id } });

    return { success: true };
  });

  // Adjust stock (create stock move)
  fastify.post('/:id/adjust', async (request, reply) => {
    const { id } = request.params;
    const { delta, reason } = request.body;

    if (delta == null || delta === 0) {
      return reply.code(400).send({ error: 'Delta deve ser diferente de zero' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return reply.code(404).send({ error: 'Produto não encontrado' });
    }

    const newQty = product.qty + delta;
    if (newQty < 0) {
      return reply.code(400).send({ error: 'Quantidade não pode ser negativa' });
    }

    await prisma.$transaction([
      prisma.stockMove.create({
        data: { productId: id, delta, reason },
      }),
      prisma.product.update({
        where: { id },
        data: { qty: newQty },
      }),
    ]);

    const updated = await prisma.product.findUnique({ where: { id } });

    return { product: updated };
  });

  // Get stock history
  fastify.get('/:id/history', async (request) => {
    const { id } = request.params;

    const moves = await prisma.stockMove.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    return { moves };
  });
}
