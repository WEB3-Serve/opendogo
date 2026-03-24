import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db/prisma.js';
import { requireAdminAuth } from '../middleware/auth.js';

export const adminRouter = express.Router();
adminRouter.use(requireAdminAuth);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value) => String(value || '').trim();
const normalizeStatus = (value) => normalize(value).toUpperCase();

const appendSystemConfig = async ({ category, configKey, configValue, createdBy }) => {
  const active = await prisma.systemConfig.findFirst({
    where: { category, configKey, isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  await prisma.$transaction(async (tx) => {
    if (active) {
      await tx.systemConfig.update({ where: { id: active.id }, data: { isActive: false } });
    }
    await tx.systemConfig.create({
      data: {
        category,
        configKey,
        configValue,
        version: (active?.version || 0) + 1,
        createdBy
      }
    });
  });
};

adminRouter.get('/dashboard', async (_req, res) => {
  const [usersTotal, licenseTotal, licenseUsed, licenseUnused, notices, configs] = await Promise.all([
    prisma.user.count(),
    prisma.licenseCode.count(),
    prisma.licenseCode.count({ where: { status: 'USED' } }),
    prisma.licenseCode.count({ where: { status: 'UNUSED' } }),
    prisma.notice.count({ where: { status: 'PUBLISHED' } }),
    prisma.systemConfig.count({ where: { isActive: true } })
  ]);

  return res.json({
    ok: true,
    stats: { usersTotal, licenseTotal, licenseUsed, licenseUnused, notices, configs }
  });
});

adminRouter.get('/users', async (req, res) => {
  const q = normalize(req.query.q);
  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ account: { contains: q } }, { id: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      group: { select: { id: true, name: true } },
      _count: { select: { licenses: true } }
    },
    take: 100
  });

  return res.json({ ok: true, users });
});

adminRouter.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { group: true }
  });
  if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

  const redeemLogs = await prisma.licenseRedeemLog.findMany({
    where: { userId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      license: {
        include: { batch: { include: { group: true } } }
      }
    }
  });

  return res.json({ ok: true, user, redeemLogs });
});

adminRouter.patch('/users/:id/status', async (req, res) => {
  const status = normalizeStatus(req.body?.status);
  if (!['ACTIVE', 'DISABLED', 'BANNED'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });
  }

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
  await prisma.auditLog.create({
    data: {
      userId: req.admin.userId,
      type: 'ADMIN_ACTION',
      action: 'USER_STATUS_UPDATE',
      metadata: { targetUserId: req.params.id, status }
    }
  });

  return res.json({ ok: true, user });
});

adminRouter.get('/user-groups', async (_req, res) => {
  const groups = await prisma.userGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } }
  });
  return res.json({ ok: true, groups });
});

adminRouter.post('/user-groups', async (req, res) => {
  const name = normalize(req.body?.name);
  if (!name) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });

  const group = await prisma.userGroup.create({
    data: { name, description: normalize(req.body?.description) || null }
  });

  await prisma.auditLog.create({
    data: { userId: req.admin.userId, type: 'ADMIN_ACTION', action: 'USER_GROUP_CREATE', metadata: { groupId: group.id } }
  });

  return res.json({ ok: true, group });
});

adminRouter.get('/user-activations', async (req, res) => {
  const account = normalize(req.query.account);
  const logs = await prisma.licenseRedeemLog.findMany({
    where: account ? { user: { account: { contains: account } } } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, account: true } },
      license: { select: { id: true, codeType: true, status: true, redeemedAt: true } }
    }
  });
  return res.json({ ok: true, logs });
});

adminRouter.get('/license-groups', async (_req, res) => {
  const groups = await prisma.licenseGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { batches: true } } }
  });
  return res.json({ ok: true, groups });
});

adminRouter.post('/license-groups', async (req, res) => {
  const name = normalize(req.body?.name);
  if (!name) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });

  const group = await prisma.licenseGroup.create({
    data: { name, description: normalize(req.body?.description) || null }
  });

  await prisma.auditLog.create({
    data: { userId: req.admin.userId, type: 'ADMIN_ACTION', action: 'LICENSE_GROUP_CREATE', metadata: { groupId: group.id } }
  });

  return res.json({ ok: true, group });
});

adminRouter.get('/licenses', async (req, res) => {
  const status = normalizeStatus(req.query.status);
  const groupId = normalize(req.query.groupId);

  const licenses = await prisma.licenseCode.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(groupId ? { batch: { groupId } } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      usedBy: { select: { id: true, account: true } },
      batch: { include: { group: true } }
    }
  });

  return res.json({ ok: true, licenses });
});

adminRouter.post('/licenses/generate', async (req, res) => {
  const qty = Math.max(1, Math.min(500, Number(req.body?.quantity) || 1));
  const codeType = normalizeStatus(req.body?.type || 'MONTH');
  const groupId = normalize(req.body?.groupId) || null;
  const allowedTypes = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'LIFETIME'];
  if (!allowedTypes.includes(codeType)) {
    return res.status(400).json({ ok: false, error: 'INVALID_LICENSE_TYPE' });
  }

  const batch = await prisma.licenseBatch.create({
    data: {
      name: normalize(req.body?.name) || `batch-${Date.now()}`,
      description: `qty=${qty},type=${codeType}`,
      createdBy: req.admin.userId,
      groupId
    }
  });

  const codes = [];
  for (let i = 0; i < qty; i += 1) {
    const plain = `${normalize(req.body?.codePrefix || 'ODG').toUpperCase()}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
    await prisma.licenseCode.create({
      data: {
        batchId: batch.id,
        codeHash: sha256(plain),
        codeType,
        expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : null
      }
    });
    codes.push(plain);
  }

  await prisma.auditLog.create({
    data: {
      userId: req.admin.userId,
      type: 'ADMIN_ACTION',
      action: 'LICENSE_GENERATE',
      metadata: { batchId: batch.id, qty, codeType, groupId }
    }
  });

  return res.json({ ok: true, batch, codes });
});

adminRouter.post('/license-redeem', async (req, res) => {
  const account = normalize(req.body?.account);
  const hash = sha256(normalize(req.body?.code));

  const user = await prisma.user.findUnique({ where: { account } });
  if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

  const result = await prisma.$transaction(async (tx) => {
    const license = await tx.licenseCode.findUnique({ where: { codeHash: hash } });
    if (!license) return { ok: false, error: 'LICENSE_NOT_FOUND', status: 404 };
    if (license.status !== 'UNUSED') return { ok: false, error: 'LICENSE_USED', status: 409 };

    const updated = await tx.licenseCode.updateMany({
      where: { id: license.id, status: 'UNUSED' },
      data: { status: 'USED', redeemedAt: new Date(), usedByUserId: user.id }
    });
    if (updated.count === 0) return { ok: false, error: 'LICENSE_USED', status: 409 };

    await tx.licenseRedeemLog.create({
      data: { userId: user.id, licenseId: license.id, actorAdminId: req.admin.userId }
    });
    await tx.auditLog.create({
      data: {
        userId: req.admin.userId,
        type: 'LICENSE_REDEEM',
        action: 'LICENSE_REDEEM_BY_ADMIN',
        metadata: { account, licenseId: license.id }
      }
    });

    return { ok: true };
  });

  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });
  return res.json({ ok: true });
});

adminRouter.get('/configs/:category', async (req, res) => {
  const category = normalize(req.params.category);
  const rows = await prisma.systemConfig.findMany({
    where: { category, isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  const configs = rows.reduce((acc, row) => {
    acc[row.configKey] = row.configValue;
    return acc;
  }, {});

  return res.json({ ok: true, category, configs });
});

adminRouter.post('/configs/:category', async (req, res) => {
  const category = normalize(req.params.category);
  const payload = req.body || {};

  const entries = Object.entries(payload);
  for (const [configKey, configValue] of entries) {
    await appendSystemConfig({ category, configKey, configValue, createdBy: req.admin.userId });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.admin.userId,
      type: 'ADMIN_ACTION',
      action: 'SYSTEM_CONFIG_UPDATE',
      metadata: { category, keys: entries.map(([k]) => k) }
    }
  });

  return res.json({ ok: true });
});

adminRouter.get('/notices', async (_req, res) => {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return res.json({ ok: true, notices });
});

adminRouter.post('/notices', async (req, res) => {
  const title = normalize(req.body?.title);
  const content = normalize(req.body?.content);
  if (!title || !content) return res.status(400).json({ ok: false, error: 'TITLE_AND_CONTENT_REQUIRED' });

  const notice = await prisma.notice.create({
    data: { title, content, status: normalizeStatus(req.body?.status || 'PUBLISHED'), createdBy: req.admin.userId }
  });

  await prisma.auditLog.create({
    data: { userId: req.admin.userId, type: 'ADMIN_ACTION', action: 'NOTICE_CREATE', metadata: { noticeId: notice.id } }
  });

  return res.json({ ok: true, notice });
});

adminRouter.delete('/notices/:id', async (req, res) => {
  await prisma.notice.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: { userId: req.admin.userId, type: 'ADMIN_ACTION', action: 'NOTICE_DELETE', metadata: { noticeId: req.params.id } }
  });
  return res.json({ ok: true });
});

adminRouter.get('/audit-logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ ok: true, logs });
});
