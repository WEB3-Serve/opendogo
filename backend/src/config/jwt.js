import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me';
const defaultExpiresIn = process.env.JWT_EXPIRES_IN || '30m';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, secret, { expiresIn: options.expiresIn || defaultExpiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, secret);
}
