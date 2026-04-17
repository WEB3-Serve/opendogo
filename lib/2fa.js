import * as OTPAuth from 'otpauth'

export function verifyTOTP(secret, token) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'ENS Manager',
      label: globalThis.ADMIN_ACCOUNT || 'admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    })
    
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

export function generateBackupCodes(count = 10) {
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
    codes.push(code)
  }
  return codes
}

export default { verifyTOTP, generateBackupCodes }
