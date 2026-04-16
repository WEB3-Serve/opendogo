import prisma from '../../config/db.js';

const CARD_TYPE_TO_DAYS = {
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
  forever: 36500
};

export async function listCards() {
  return prisma.cardKey.findMany({ include: { group: true }, orderBy: { id: 'desc' } });
}

export async function listCardGroups() {
  return prisma.cardGroup.findMany({ orderBy: { id: 'desc' } });
}

export async function activateCard({ userId, cardKey }) {
  return prisma.$transaction(async (tx) => {
    const card = await tx.cardKey.findUnique({ where: { cardKey } });
    if (!card || card.status !== 'new') throw new Error('card unavailable');

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('user not found');

    await tx.activationLog.create({ data: { cardKeyId: card.id, userId } });

    const base = user.activeUntil && user.activeUntil > new Date() ? user.activeUntil : new Date();
    const next = new Date(base.getTime() + CARD_TYPE_TO_DAYS[card.cardType] * 24 * 3600 * 1000);

    await tx.user.update({ where: { id: userId }, data: { activeUntil: next } });
    await tx.cardKey.update({ where: { id: card.id }, data: { status: 'used', usedById: userId, usedAt: new Date() } });

    return { ok: true, userId, cardKey, activeUntil: next };
  });
}
