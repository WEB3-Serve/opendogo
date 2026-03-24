import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db/prisma.js';
import { requireAdminAuth } from '../middleware/auth.js';

export const adminRouter = express.Router();
adminRouter.use(requireAdminAuth);


adminRouter.get('/dashboard', async (_req, res) => {
  const [users, activeUsers, licenseTotal, licenseUsed, domainRules] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.licenseCode.count(),
    prisma.licenseCode.count({ where: { status: 'USED' } }),
    prisma.domainRule.count()
  ]);

  res.json({
    ok: true,
    stats: {
      users,
      activeUsers,
      licenseTotal,
      licenseUsed,
      licenseUnused: Math.max(licenseTotal - licenseUsed, 0),
      domainRules
    }
  });
});

adminRouter.get('/domain-rules', async (_req, res) => {
  const rules = await prisma.domainRule.findMany({ orderBy: { moduleKey: 'asc' } });
  res.json({ ok: true, rules });
});

adminRouter.get('/license-batches', async (_req, res) => {
  const batches = await prisma.licenseBatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { codes: true } } },
    take: 100
  });
  res.json({ ok: true, batches });
});

adminRouter.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['ACTIVE', 'DISABLED', 'BANNED'].includes(String(status))) {
    return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: String(status) }
  });

  await prisma.auditLog.create({
    data: {
      userId: req.admin.userId,
      type: 'ADMIN_ACTION',
      action: 'USER_STATUS_UPDATE',
      metadata: { targetUserId: id, status }
    }
  });

  return res.json({ ok: true, user });
});

adminRouter.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, account: true, role: true, status: true, is2faEnabled: true, createdAt: true }
  });
  res.json({ ok: true, users });
});


adminRouter.get('/user-records/:account', async (req, res) => {
  const { account } = req.params;
  const user = await prisma.user.findUnique({ where: { account } });
  if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

  const redeemLogs = await prisma.licenseRedeemLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { license: { select: { id: true, status: true, redeemedAt: true } } }
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return res.json({ ok: true, user: { id: user.id, account: user.account, status: user.status }, redeemLogs, auditLogs });
});

adminRouter.get('/audit-logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ ok: true, logs });
});

adminRouter.post('/domain-rules', async (req, res) => {
  const { moduleKey, enabled, allowedDomains, fallbackUrl } = req.body || {};
  const row = await prisma.domainRule.upsert({
    where: { moduleKey },
    create: {
      moduleKey,
      enabled: Boolean(enabled),
      allowedDomains: JSON.stringify(allowedDomains || []),
      fallbackUrl: fallbackUrl || null,
      updatedBy: req.admin.userId
    },
    update: {
      enabled: Boolean(enabled),
      allowedDomains: JSON.stringify(allowedDomains || []),
      fallbackUrl: fallbackUrl || null,
      updatedBy: req.admin.userId
    }
  });
  res.json({ ok: true, rule: row });
});

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

adminRouter.post('/license-batches', async (req, res) => {
  const { name, quantity = 1, codePrefix = 'ODG', expiresAt = null } = req.body || {};

  const batch = await prisma.licenseBatch.create({
    data: { name, description: `qty=${quantity}` }
  });

  const codes = [];
  for (let i = 0; i < Number(quantity); i += 1) {
    const plain = `${codePrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const code = await prisma.licenseCode.create({
      data: {
        batchId: batch.id,
        codeHash: sha256(plain),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
    codes.push({ id: code.id, code: plain });
  }

  res.json({ ok: true, batchId: batch.id, codes });
});

adminRouter.post('/license-redeem', async (req, res) => {
  const { account, code } = req.body || {};
  const hash = sha256(String(code || ''));

  const user = await prisma.user.findUnique({ where: { account } });
  if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

  const license = await prisma.licenseCode.findUnique({ where: { codeHash: hash } });
  if (!license) return res.status(404).json({ ok: false, error: 'LICENSE_NOT_FOUND' });
  if (license.status !== 'UNUSED') return res.status(400).json({ ok: false, error: 'LICENSE_USED' });
  if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ ok: false, error: 'LICENSE_EXPIRED' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.licenseCode.update({
      where: { id: license.id },
      data: { status: 'USED', redeemedAt: new Date() }
    });

    await tx.licenseRedeemLog.create({
      data: { userId: user.id, licenseId: license.id }
    });

    await tx.auditLog.create({
      data: {
        userId: req.admin.userId,
        type: 'LICENSE_REDEEM',
        action: 'LICENSE_REDEEM_BY_ADMIN',
        metadata: { targetAccount: account, licenseId: license.id }
      }
    });
  });

  return res.json({ ok: true });
});
