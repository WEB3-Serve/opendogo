import crypto from 'crypto';

import { signJwt, verifyJwt } from '../../config/jwt.js';

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(base32 || '').toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = '';
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(secret, epochSec = Math.floor(Date.now() / 1000), step = 30, digits = 6) {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(epochSec / step);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);

  const code = (binCode % (10 ** digits)).toString().padStart(digits, '0');
  return code;
}

export function validateAdminAccount(account, password) {
  const envAccount = process.env.ADMIN_ACCOUNT;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envAccount || !envPassword) {
    throw new Error('Missing ADMIN_ACCOUNT/ADMIN_PASSWORD env');
  }

  return safeEqual(account, envAccount) && safeEqual(password, envPassword);
}

export function issuePreAuthToken(account) {
  return signJwt({ phase: 'pre_2fa', account }, { expiresIn: '5m' });
}

export function verifyPreAuthToken(token) {
  const payload = verifyJwt(token);
  if (payload.phase !== 'pre_2fa') {
    throw new Error('invalid pre-auth token');
  }
  return payload;
}

export function verify2FACode(code) {
  const env2FASecret = process.env.ADMIN_2FA;
  if (!env2FASecret) {
    throw new Error('Missing ADMIN_2FA env (Google Authenticator secret in Base32)');
  }

  const now = Math.floor(Date.now() / 1000);
  const input = String(code || '').trim();

  // allow time drift: previous/current/next 30s window
  const valid = [
    generateTotp(env2FASecret, now - 30),
    generateTotp(env2FASecret, now),
    generateTotp(env2FASecret, now + 30)
  ].some((expected) => safeEqual(input, expected));

  return valid;
}

export function issueAccessToken(account) {
  return signJwt({ username: account, role: 'super_admin' });
}
