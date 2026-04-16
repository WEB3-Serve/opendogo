import { verifyJwt } from '../../config/jwt.js';

export function auth(requiredRoles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const user = verifyJwt(token);
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}
