import OTPAuth from 'otpauth';

export function verifyTOTP(secret, token) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'OpenDoGo Admin',
      label: 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });
    
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

export function generateSecret() {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function getProvisioningURI(secret) {
  const totp = new OTPAuth.TOTP({
    issuer: 'OpenDoGo Admin',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });
  
  return totp.toString();
}
