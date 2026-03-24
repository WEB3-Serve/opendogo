import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const requireAdminAuth = (req, res, next) => {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';

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
