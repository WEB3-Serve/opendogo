import { createHash } from 'crypto'

export function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

export function generateApiKey() {
  return Array.from({ length: 32 }, () => 
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('')
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  return input.replace(/[<>\"'&]/g, '')
}

export default { hashPassword, verifyPassword, generateApiKey, sanitizeInput }
