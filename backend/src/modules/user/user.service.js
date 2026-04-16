import prisma from '../../config/db.js';

export async function listUsers() {
  return prisma.user.findMany({ include: { group: true }, orderBy: { id: 'desc' } });
}

export async function getUserById(id) {
  return prisma.user.findUnique({ where: { id }, include: { group: true } });
}

export async function listGroups() {
  return prisma.userGroup.findMany({ orderBy: { id: 'desc' } });
}

export async function listActivations() {
  return prisma.activationLog.findMany({ include: { user: true, card: true }, orderBy: { id: 'desc' } });
}
