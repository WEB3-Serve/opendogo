import { config } from '../config.js';
import { prisma } from '../db/prisma.js';

const getRequestHost = (req) => {
  const forwarded = req.headers['x-forwarded-host'];
  if (forwarded) return String(forwarded).split(',')[0].trim().toLowerCase();
  if (req.headers.host) return String(req.headers.host).split(':')[0].toLowerCase();
  return '';
};

const getOriginHost = (req) => {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return '';
  try {
    return new URL(String(origin)).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const parseDomains = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v).toLowerCase());
  } catch {
    // ignore json parse fail and fallback
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const getModuleKey = (path) => {
  if (path.startsWith('/api/admin')) return 'admin';
  if (path.startsWith('/api/')) return 'api';
  if (path.startsWith('/redeem')) return 'redeem';
  return 'web';
};

const isApiRequest = (req) => req.path.startsWith('/api/');

export const domainGuard = async (req, res, next) => {
  if (!config.domainRestrictionEnabled) return next();

  const host = getRequestHost(req);
  const originHost = getOriginHost(req);
  const moduleKey = getModuleKey(req.path);

  const rule = await prisma.domainRule.findUnique({ where: { moduleKey } });
  const ruleEnabled = rule ? rule.enabled : true;

  const allowedDomains = rule && ruleEnabled
    ? parseDomains(rule.allowedDomains)
    : config.allowedDomains.map((item) => item.toLowerCase());

  const fallbackUrl = rule?.fallbackUrl || config.domainFallbackUrl;

  const hostAllowed = allowedDomains.includes(host);
  const originAllowed = !originHost || config.allowedOrigins.includes(originHost);
  if (hostAllowed && originAllowed) return next();

  if (isApiRequest(req)) {
    return res.status(403).json({
      ok: false,
      error: 'DOMAIN_NOT_ALLOWED',
      host,
      originHost,
      module: moduleKey
    });
  }

  return res.redirect(302, fallbackUrl);
};
