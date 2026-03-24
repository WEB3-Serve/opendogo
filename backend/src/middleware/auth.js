import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const getToken = (req) => {
  const raw = req.headers.authorization || '';
  return raw.startsWith('Bearer ') ? raw.slice(7) : '';
};

export const requireAdminAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret);
    if (!payload?.isAdmin) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'TOKEN_INVALID' });
  }
};

export const requireUserAuth = (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }
  try {
    const payload = jwt.verify(token, config.jwtAccessSecret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'TOKEN_INVALID' });
  }
};
