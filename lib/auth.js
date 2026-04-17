import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production')
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '4h'

export async function createToken(payload, expiresIn = JWT_EXPIRES_IN) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

export function parseAuthHeader(header) {
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.substring(7)
}

export default { createToken, verifyToken, parseAuthHeader }
