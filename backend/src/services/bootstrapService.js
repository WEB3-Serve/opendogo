import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { prisma } from '../db/prisma.js';
import { encryptText } from '../security/crypto.js';

export const ensureAdminUser = async () => {
  const account = process.env.ADMIN_ACCOUNT || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme';
  const passwordHashFromEnv = process.env.ADMIN_PASSWORD_HASH || '';
  const twoFaSecretPlain = process.env.ADMIN_TOTP_SECRET || authenticator.generateSecret();

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
    console.log('[bootstrap] admin password created from ADMIN_PASSWORD env (change immediately).');
  }
  console.log(`[bootstrap] admin TOTP secret (save once): ${twoFaSecretPlain}`);
};
