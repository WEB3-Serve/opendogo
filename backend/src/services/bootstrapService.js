import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { prisma } from '../db/prisma.js';
import { encryptText } from '../security/crypto.js';

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

export const ensureAdminUser = async () => {
  const account = readEnv('ADMIN_ACCOUNT', 'admin_account') || 'admin';
  const password = readEnv('ADMIN_PASSWORD', 'admin_password') || 'changeme';
  const passwordHashFromEnv = readEnv('ADMIN_PASSWORD_HASH', 'admin_password_hash');
  const twoFaSecretPlain = readEnv('ADMIN_2FA', 'ADMIN_TOTP_SECRET', 'TWO_FA_SECRET') || authenticator.generateSecret();

  const existing = await prisma.user.findUnique({ where: { account } });
  if (existing) return;

  const passwordHash = passwordHashFromEnv || await bcrypt.hash(password, 10);
  const encrypted2faSecret = encryptText(twoFaSecretPlain);

  await prisma.user.create({
    data: {
      account,
      passwordHash,
      role: 'admin',
      is2faEnabled: true,
      twoFaSecret: encrypted2faSecret
    }
  });

  console.log(`[bootstrap] admin account created: ${account}`);
  if (!passwordHashFromEnv) {
    console.log('[bootstrap] admin password created from environment variable (change immediately).');
  }
  console.log(`[bootstrap] admin TOTP secret (save once): ${twoFaSecretPlain}`);
};
