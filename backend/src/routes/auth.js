import express from 'express';
import { loginPassword, login2fa, refreshAccess } from '../services/authService.js';
import { prisma } from '../db/prisma.js';

export const authRouter = express.Router();

const getIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

const writeAudit = async ({ userId = null, type, action, req, metadata = {} }) => {
  await prisma.auditLog.create({
    data: {
      userId,
      type,
      action,
      ip: String(getIp(req) || ''),
      userAgent: String(req.headers['user-agent'] || ''),
      metadata
    }
  });
};

authRouter.post('/login-password', async (req, res) => {
  const { account, password } = req.body || {};
  const result = await loginPassword({ account, password });

  await writeAudit({
    type: 'LOGIN',
    action: result.ok ? 'LOGIN_PASSWORD_SUCCESS' : 'LOGIN_PASSWORD_FAIL',
    req,
    metadata: { account, error: result.error || null }
  });

  if (!result.ok) {
    return res.status(result.status || 400).json({ ok: false, error: result.error });
  }
  return res.json(result);
});

authRouter.post('/login-2fa', async (req, res) => {
  const { login_ticket: loginTicket, totp_code: totpCode } = req.body || {};
  const result = await login2fa({ loginTicket, totpCode });

  await writeAudit({
    userId: result.ok ? result.user_id : null,
    type: 'LOGIN_2FA',
    action: result.ok ? 'LOGIN_2FA_SUCCESS' : 'LOGIN_2FA_FAIL',
    req,
    metadata: { error: result.error || null }
  });

  if (!result.ok) {
    return res.status(result.status || 400).json({ ok: false, error: result.error });
  }
  const { user_id: _userId, ...response } = result;
  return res.json(response);
});

authRouter.post('/refresh', (req, res) => {
  const { refresh_token: refreshToken } = req.body || {};
  const result = refreshAccess({ refreshToken });
  if (!result.ok) {
    return res.status(result.status || 400).json({ ok: false, error: result.error });
  }
  return res.json(result);
});

authRouter.post('/logout', (_req, res) => res.json({ ok: true }));
