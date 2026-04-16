import { Router } from 'express';

import { loginRateLimit } from '../../common/middleware/rateLimit.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { getRiskState, markLoginFailed, markLoginSuccess } from './loginRisk.service.js';
import {
  issueAccessToken,
  issuePreAuthToken,
  validateAdminAccount,
  verify2FACode,
  verifyPreAuthToken
} from './auth.service.js';

const router = Router();

router.post('/prelogin', loginRateLimit, asyncHandler(async (req, res) => {
  const { account, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (!account || !password) return res.status(400).json({ message: 'account/password required' });

  const risk = getRiskState(ip, account);
  if (risk.locked) {
    return res.status(429).json({ message: 'account temporarily locked', retryAfterSec: risk.retryAfterSec });
  }

  const ok = validateAdminAccount(account, password);
  if (!ok) {
    const nextRisk = markLoginFailed(ip, account);
    return res.status(401).json({ message: 'invalid credentials', retryAfterSec: nextRisk.retryAfterSec });
  }

  const preAuthToken = issuePreAuthToken(account);
  return res.json({ ok: true, need2FA: true, preAuthToken });
}));

router.post('/login', loginRateLimit, asyncHandler(async (req, res) => {
  const { preAuthToken, code } = req.body;
  if (!preAuthToken || !code) return res.status(400).json({ message: 'preAuthToken/code required' });

  const payload = verifyPreAuthToken(preAuthToken);
  const ok = verify2FACode(code);
  if (!ok) {
    return res.status(401).json({ message: 'invalid 2fa code' });
  }

  markLoginSuccess(req.ip || 'unknown', payload.account);
  const token = issueAccessToken(payload.account);
  return res.json({ token, role: 'super_admin', username: payload.account });
}));

export default router;
