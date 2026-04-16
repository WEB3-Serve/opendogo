import crypto from 'node:crypto';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function toBase32(buffer) {
  let bits = '';
  for (const b of buffer) bits += b.toString(2).padStart(8, '0');

  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += alphabet[Number.parseInt(chunk, 2)];
  }
  return out;
}

const secret = toBase32(crypto.randomBytes(20));
console.log('ADMIN_2FA=' + secret);
console.log('otpauth://totp/OpenDogoAdmin?secret=' + secret + '&issuer=OpenDogo');
