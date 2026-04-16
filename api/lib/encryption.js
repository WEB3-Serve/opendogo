import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 加密数据
 * @param {Object} data - 要加密的数据对象
 * @returns {string} - Base64 加密字符串
 */
export function encryptData(data) {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  return encrypted;
}

/**
 * 解密数据
 * @param {string} encryptedData - Base64 加密字符串
 * @returns {Object|null} - 解密后的数据对象，失败返回 null
 */
export function decryptData(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    if (!jsonString) {
      return null;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * 生成请求签名
 * @param {Object} payload - 请求载荷
 * @param {string} timestamp - 时间戳
 * @returns {string} - HMAC-SHA256 签名
 */
export function generateSignature(payload, timestamp) {
  const dataToSign = JSON.stringify(payload) + timestamp;
  const signature = CryptoJS.HmacSHA256(dataToSign, ENCRYPTION_KEY).toString(CryptoJS.enc.Hex);
  return signature;
}

/**
 * 验证请求签名
 * @param {Object} payload - 请求载荷
 * @param {string} timestamp - 时间戳
 * @param {string} receivedSignature - 接收到的签名
 * @returns {boolean} - 签名是否有效
 */
export function verifySignature(payload, timestamp, receivedSignature) {
  const expectedSignature = generateSignature(payload, timestamp);
  return expectedSignature === receivedSignature;
}
