import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { config } from '../config.js';
import { prisma } from '../db/prisma.js';
import { getRedis } from '../db/redis.js';
import { decryptText } from '../security/crypto.js';

const redis = getRedis();
const loginTickets = new Map();

const lockKey = (account) => `auth:lock:${account}`;
const failKey = (account) => `auth:fail:${account}`;

const setLockIfNeeded = async (account, fails) => {
  if (!redis) return;
  if (fails >= config.loginMaxFail) {
    await redis.set(lockKey(account), '1', 'EX', config.loginLockMinutes * 60);
    await redis.del(failKey(account));
  }
};

const increaseFailCount = async (account) => {
  if (!redis) return 0;
  const fails = await redis.incr(failKey(account));
  if (fails === 1) {
    await redis.expire(failKey(account), config.loginLockMinutes * 60);
  }
  await setLockIfNeeded(account, fails);
  return fails;
};

const clearFailCount = async (account) => {
  if (!redis) return;
  await redis.del(failKey(account));
};

export const isLocked = async (account) => {
  if (!redis) return false;
  const locked = await redis.get(lockKey(account));
  return locked === '1';
};

export const loginPassword = async ({ account, password }) => {
  const user = await prisma.user.findUnique({ where: { account } });
  if (!user) {
    await increaseFailCount(account);
    return { ok: false, error: 'ACCOUNT_OR_PASSWORD_INVALID', status: 401 };
  }

  if (user.status !== 'ACTIVE') {
    return { ok: false, error: 'ACCOUNT_DISABLED', status: 403 };
  }

  if (await isLocked(account)) {
    return { ok: false, error: 'ACCOUNT_LOCKED', status: 423 };
  }

  const passOk = await bcrypt.compare(password, user.passwordHash);
  if (!passOk) {
    await increaseFailCount(account);
    return { ok: false, error: 'ACCOUNT_OR_PASSWORD_INVALID', status: 401 };
  }

  await clearFailCount(account);

  const loginTicket = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  loginTickets.set(loginTicket, {
    userId: user.id,
    account: user.account,
    requires2fa: config.adminForce2fa || user.is2faEnabled,
    expiresAt: Date.now() + 2 * 60 * 1000
  });

  return { ok: true, requires_2fa: true, login_ticket: loginTicket };
};

const makeAccessToken = (payload) =>
  jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.accessTokenExpires });

const makeRefreshToken = (payload) =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.refreshTokenExpires });

export const login2fa = async ({ loginTicket, totpCode }) => {
  const ticket = loginTickets.get(loginTicket);
  if (!ticket || ticket.expiresAt < Date.now()) {
    return { ok: false, error: 'LOGIN_TICKET_INVALID', status: 401 };
  }

  const user = await prisma.user.findUnique({ where: { id: ticket.userId } });
  if (!user) {
    return { ok: false, error: 'USER_NOT_FOUND', status: 404 };
  }

  if (!user.twoFaSecret) {
    return { ok: false, error: 'TWO_FA_NOT_CONFIGURED', status: 400 };
  }

  const rawSecret = user.twoFaSecret.includes(':') ? decryptText(user.twoFaSecret) : user.twoFaSecret;
  if (!rawSecret) {
    return { ok: false, error: 'TWO_FA_SECRET_DECRYPT_FAIL', status: 500 };
  }

  const valid = authenticator.check(String(totpCode), rawSecret);
  if (!valid) {
    return { ok: false, error: 'TOTP_INVALID', status: 401 };
  }

  loginTickets.delete(loginTicket);

  const payload = { userId: user.id, account: user.account, role: user.role, isAdmin: true };
  return {
    ok: true,
    user_id: user.id,
    access_token: makeAccessToken(payload),
    refresh_token: makeRefreshToken(payload)
  };
};

export const refreshAccess = ({ refreshToken }) => {
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const accessToken = makeAccessToken({
      userId: payload.userId,
      account: payload.account,
      role: payload.role,
      isAdmin: payload.isAdmin
    });
    return { ok: true, access_token: accessToken };
  } catch {
    return { ok: false, error: 'REFRESH_TOKEN_INVALID', status: 401 };
  }
};
