import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

const getKey = () => {
  const key = process.env.ADMIN_SECRET_ENC_KEY || 'dev_admin_secret_key_change_me_32bytes!';
  return crypto.createHash('sha256').update(key).digest();
};

export const encryptText = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptText = (cipherText) => {
  const [ivHex, tagHex, dataHex] = String(cipherText || '').split(':');
  if (!ivHex || !tagHex || !dataHex) return '';

  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};
