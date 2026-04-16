/**
 * 加密工具模块
 * 使用 AES-GCM 进行数据加密，RSA 进行密钥交换
 */

// 生成随机密钥（用于 AES）
export function generateAESKey() {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// 导出密钥为原始字节
export async function exportKey(key) {
  return await window.crypto.subtle.exportKey('raw', key);
}

// 导入密钥
export async function importKey(keyData) {
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// AES 加密
export async function encryptAES(data, key) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  // 合并 IV 和密文
  const encryptedBytes = new Uint8Array(encrypted);
  const result = new Uint8Array(iv.length + encryptedBytes.length);
  result.set(iv, 0);
  result.set(encryptedBytes, iv.length);
  
  return arrayBufferToBase64(result.buffer);
}

// AES 解密
export async function decryptAES(encryptedData, key) {
  const decoder = new TextDecoder();
  const encryptedBytes = base64ToArrayBuffer(encryptedData);
  
  // 提取 IV 和密文
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    ciphertext
  );
  
  return JSON.parse(decoder.decode(decrypted));
}

// Base64 编码
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 解码
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 生成 RSA 密钥对
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// 导出公钥
export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(exported);
}

// 导入公钥
export async function importPublicKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

// RSA 加密（用于加密 AES 密钥）
export async function encryptRSA(data, publicKey) {
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoder.encode(data)
  );
  return arrayBufferToBase64(encrypted);
}

// 将 ArrayBuffer 转为 Hex 字符串
export function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 将 Hex 字符串转为 ArrayBuffer
export function hexToArrayBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// 生成会话 ID
export function generateSessionId() {
  return arrayBufferToHex(window.crypto.getRandomValues(new Uint8Array(16)));
}
