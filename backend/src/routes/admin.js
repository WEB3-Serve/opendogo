'use strict';

const crypto = require('crypto');

const TOKEN_TTL_SECONDS = Number.parseInt(process.env.ADMIN_TOKEN_TTL_SECONDS || '7200', 10);
const TOTP_STEP_SECONDS = Number.parseInt(process.env.ADMIN_2FA_STEP_SECONDS || '30', 10);
const TOTP_WINDOW = Number.parseInt(process.env.ADMIN_2FA_WINDOW || '1', 10);
const TOTP_DIGITS = Number.parseInt(process.env.ADMIN_2FA_DIGITS || '6', 10);

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest();
}

function safeEqual(input, expected) {
  return crypto.timingSafeEqual(sha256(input), sha256(expected));
}

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(text) {
  const normalized = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return Buffer.from(padded, 'base64');
}

function decodeBase32(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = String(secret || '')
    .toUpperCase()
    .replace(/[\s=-]/g, '');

  if (!normalized) {
    throw new Error('Empty base32 secret.');
  }

  let value = 0;
  let bits = 0;
  const bytes = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const idx = alphabet.indexOf(normalized[i]);
    if (idx < 0) {
      throw new Error('Invalid base32 secret.');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateHotp(secretBytes, counter, digits) {
  const counterBuffer = Buffer.alloc(8);
  let cursor = BigInt(counter);

  for (let i = 7; i >= 0; i -= 1) {
    counterBuffer[i] = Number(cursor & 255n);
    cursor >>= 8n;
  }

  const digest = crypto.createHmac('sha1', secretBytes).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const code =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);

  const mod = 10 ** digits;
  return String(code % mod).padStart(digits, '0');
}

function verifyTotp(code, secret) {
  const normalizedCode = String(code || '').replace(/\s+/g, '');
  if (!/^\d+$/.test(normalizedCode)) {
    return false;
  }

  let secretBytes;
  try {
    secretBytes = decodeBase32(secret);
  } catch (_) {
    return false;
  }

  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  for (let drift = -TOTP_WINDOW; drift <= TOTP_WINDOW; drift += 1) {
    const expected = generateHotp(secretBytes, counter + drift, TOTP_DIGITS);
    if (safeEqual(normalizedCode, expected)) {
      return true;
    }
  }
  return false;
}

function getSecrets() {
  const account = process.env.ADMIN_ACCOUNT || '';
  const password = process.env.ADMIN_PASSWORD || '';
  const twoFactorSecret = process.env.ADMIN_2FA || '';
  const authSecret = process.env.ADMIN_AUTH_SECRET || '';

  if (!account || !password || !twoFactorSecret) {
    return {
      ok: false,
      error: 'Missing ADMIN_ACCOUNT / ADMIN_PASSWORD / ADMIN_2FA in env.'
    };
  }

  if (!authSecret) {
    return {
      ok: false,
      error: 'Missing ADMIN_AUTH_SECRET in env.'
    };
  }

  return {
    ok: true,
    value: { account, password, twoFactorSecret, authSecret }
  };
}

function maskAccount(account) {
  if (!account) return '';
  if (account.length <= 2) return '*'.repeat(account.length);
  return `${account.slice(0, 1)}***${account.slice(-1)}`;
}

function parseToken(token) {
  const segments = String(token || '').split('.');
  if (segments.length !== 4 || segments[0] !== 'v1') {
    throw new Error('Invalid token format.');
  }

  return {
    iv: fromBase64Url(segments[1]),
    tag: fromBase64Url(segments[2]),
    encrypted: fromBase64Url(segments[3])
  };
}

function encryptPayload(payload, secret) {
  const key = crypto.createHash('sha256').update(secret, 'utf8').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `v1.${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
}

function decryptPayload(token, secret) {
  const key = crypto.createHash('sha256').update(secret, 'utf8').digest();
  const { iv, tag, encrypted } = parseToken(token);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

function parseBody(req) {
  if (!req || typeof req !== 'object') return Promise.resolve({});
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (_) {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function readToken(req, body) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  if (body && typeof body.token === 'string') return body.token;
  return '';
}

async function handleLogin(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Only POST is allowed.' });
  }

  const secretResult = getSecrets();
  if (!secretResult.ok) {
    return sendJson(res, 500, { success: false, message: secretResult.error });
  }

  const body = await parseBody(req);
  const account = String(body.account || '').trim();
  const password = String(body.password || '');
  const twoFactorCode = String(body.twoFactorCode || body.otp || '').trim();
  const expected = secretResult.value;

  const accountOk = safeEqual(account, expected.account);
  const passwordOk = safeEqual(password, expected.password);
  const twoFactorOk = verifyTotp(twoFactorCode, expected.twoFactorSecret);

  if (!accountOk || !passwordOk || !twoFactorOk) {
    return sendJson(res, 401, { success: false, message: 'Invalid account/password/2FA code.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const token = encryptPayload(
    {
      role: 'admin',
      account: expected.account,
      iat: now,
      exp,
      nonce: crypto.randomBytes(8).toString('hex')
    },
    expected.authSecret
  );

  return sendJson(res, 200, {
    success: true,
    message: 'Login success.',
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
    account: maskAccount(expected.account)
  });
}

async function handleVerify(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Only GET/POST is allowed.' });
  }

  const secretResult = getSecrets();
  if (!secretResult.ok) {
    return sendJson(res, 500, { success: false, message: secretResult.error });
  }

  const body = req.method === 'POST' ? await parseBody(req) : {};
  const token = readToken(req, body);
  if (!token) {
    return sendJson(res, 401, { success: false, message: 'Missing token.' });
  }

  try {
    const payload = decryptPayload(token, secretResult.value.authSecret);
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return sendJson(res, 401, { success: false, message: 'Session expired.' });
    }

    return sendJson(res, 200, {
      success: true,
      message: 'Session valid.',
      account: maskAccount(payload.account || secretResult.value.account),
      expiresAt: new Date(payload.exp * 1000).toISOString()
    });
  } catch (_) {
    return sendJson(res, 401, { success: false, message: 'Invalid token.' });
  }
}

module.exports = {
  handleLogin,
  handleVerify
};
