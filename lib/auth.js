import { SignJWT, jwtVerify } from 'jose'

let JWT_SECRET
let JWT_EXPIRES_IN

function getEnv() {
  if (!JWT_SECRET) {
    JWT_SECRET = new TextEncoder().encode(globalThis.JWT_SECRET || 'default-secret-change-in-production')
    JWT_EXPIRES_IN = globalThis.JWT_EXPIRES_IN || '4h'
  }
  return { JWT_SECRET, JWT_EXPIRES_IN }
}

export async function createToken(payload, expiresIn) {
  const { JWT_SECRET: secret, JWT_EXPIRES_IN: defaultExpiresIn } = getEnv()
  const expiration = expiresIn || defaultExpiresIn
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret)
  
  return token
}

export async function verifyToken(token) {
  try {
    const { JWT_SECRET: secret } = getEnv()
    const { payload } = await jwtVerify(token, secret)
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
