import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { config } from '../config.js';
import { requireUserAuth } from '../middleware/auth.js';

export const clientRouter = express.Router();

const makeAccessToken = (payload) =>
  jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.accessTokenExpires });

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const roleLimit = (role) => {
  if (String(role || '').toLowerCase() === 'vip') return config.vipQueryLimit;
  if (role) return config.registeredQueryLimit;
  return config.guestQueryLimit;
};

const getPayloadFromAuth = (req) => {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtAccessSecret);
  } catch {
    return null;
  }
};

clientRouter.get('/query-limit', (req, res) => {
  const payload = getPayloadFromAuth(req);
  const role = payload?.role || 'guest';
  const limit = roleLimit(payload?.role);
  return res.json({
    ok: true,
    role,
    limit: Number.isFinite(limit) ? limit : null,
    limits: {
      guest: config.guestQueryLimit,
      registered: config.registeredQueryLimit,
      vip: null
    }
  });
});

clientRouter.post('/register', async (req, res) => {
  const { account, password } = req.body || {};
  const normalized = String(account || '').trim();
  const plainPassword = String(password || '');
  if (!normalized || !plainPassword) {
    return res.status(400).json({ ok: false, error: 'ACCOUNT_OR_PASSWORD_REQUIRED' });
  }
  if (plainPassword.length < 6) {
    return res.status(400).json({ ok: false, error: 'PASSWORD_TOO_SHORT' });
  }

  const exists = await prisma.user.findUnique({ where: { account: normalized } });
  if (exists) return res.status(409).json({ ok: false, error: 'ACCOUNT_EXISTS' });

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const user = await prisma.user.create({
    data: {
      account: normalized,
      passwordHash,
      role: 'user',
      is2faEnabled: false
    }
  });

  const accessToken = makeAccessToken({
    userId: user.id,
    account: user.account,
    role: user.role,
    isAdmin: false
  });
  return res.json({ ok: true, access_token: accessToken, user: { id: user.id, account: user.account } });
});

clientRouter.post('/login', async (req, res) => {
  const { account, password } = req.body || {};
  const normalized = String(account || '').trim();
  const plainPassword = String(password || '');
  if (!normalized || !plainPassword) {
    return res.status(400).json({ ok: false, error: 'ACCOUNT_OR_PASSWORD_REQUIRED' });
  }

  const user = await prisma.user.findUnique({ where: { account: normalized } });
  if (!user) return res.status(401).json({ ok: false, error: 'ACCOUNT_OR_PASSWORD_INVALID' });
  if (user.status !== 'ACTIVE') return res.status(403).json({ ok: false, error: 'ACCOUNT_DISABLED' });

  const passOk = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!passOk) return res.status(401).json({ ok: false, error: 'ACCOUNT_OR_PASSWORD_INVALID' });

  const accessToken = makeAccessToken({
    userId: user.id,
    account: user.account,
    role: user.role,
    isAdmin: user.role === 'admin'
  });
  return res.json({ ok: true, access_token: accessToken, user: { id: user.id, account: user.account } });
});

clientRouter.get('/profile', requireUserAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, account: true, status: true, role: true }
  });
  if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
  return res.json({ ok: true, user });
});

clientRouter.post('/redeem', requireUserAuth, async (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (!code) return res.status(400).json({ ok: false, error: 'CODE_REQUIRED' });

  const hash = sha256(code);
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
      data: { userId: req.user.userId, licenseId: license.id }
    });
    await tx.auditLog.create({
      data: {
        userId: req.user.userId,
        type: 'LICENSE_REDEEM',
        action: 'LICENSE_REDEEM_BY_USER',
        metadata: { licenseId: license.id }
      }
    });
  });

  return res.json({ ok: true, status: 'ACTIVATED' });
});
