import prisma from '../../config/db.js';

export async function dashboardSummary() {
  const [users, cards, nodes] = await Promise.all([
    prisma.user.count(),
    prisma.cardKey.count(),
    prisma.rpcNode.count()
  ]);

  return { users, cards, rpcNodes: nodes };
}
