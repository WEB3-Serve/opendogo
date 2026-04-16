import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultGroup = await prisma.userGroup.upsert({
    where: { name: 'default' },
    update: {},
    create: { name: 'default' }
  });

  await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: { username: 'demo_user', groupId: defaultGroup.id }
  });

  await prisma.cardGroup.upsert({
    where: { name: 'standard' },
    update: {},
    create: { name: 'standard' }
  });

  await prisma.systemConfig.upsert({
    where: { scope_key: { scope: 'security', key: 'login_max_failed' } },
    update: { value: '5' },
    create: { scope: 'security', key: 'login_max_failed', value: '5' }
  });

  console.log('seed completed');
}

main().finally(async () => prisma.$disconnect());
