import dotenv from 'dotenv';

dotenv.config();

const bool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const list = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  domainRestrictionEnabled: bool(process.env.DOMAIN_RESTRICTION_ENABLED, true),
  allowedDomains: list(process.env.ALLOWED_DOMAINS),
  domainFallbackUrl: process.env.DOMAIN_FALLBACK_URL || 'https://opendogo.vercel.app',
  adminForce2fa: bool(process.env.ADMIN_FORCE_2FA, true),
  loginMaxFail: Number(process.env.LOGIN_MAX_FAIL || 5),
  loginLockMinutes: Number(process.env.LOGIN_LOCK_MINUTES || 15)
};
