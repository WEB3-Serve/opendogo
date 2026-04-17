/**
 * 认证管理模块 - JWT / Session 管理
 */
import { getSupabaseClient } from './supabase-client.js';

const TOKEN_KEY = 'ens_manager_token';
const USER_KEY = 'ens_manager_user';
const EXPIRES_KEY = 'ens_manager_expires';

export class AuthManager {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  // 存储 Token
  setToken(token, expiresIn = '4h') {
    localStorage.setItem(TOKEN_KEY, token);
    
    // 计算过期时间
    const expiresAt = new Date(Date.now() + this.parseExpiresIn(expiresIn));
    localStorage.setItem(EXPIRES_KEY, expiresAt.toISOString());
  }

  // 获取 Token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // 检查 Token 是否有效
  isAuthenticated() {
    const token = this.getToken();
    const expiresAt = localStorage.getItem(EXPIRES_KEY);

    if (!token) return false;
    if (!expiresAt) return false;

    // 检查是否过期
    if (new Date(expiresAt) <= new Date()) {
      this.clear();
      return false;
    }

    return true;
  }

  // 获取当前用户
  async getCurrentUser() {
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await fetch('/api/auth?action=me', {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (response.ok) {
        const { user } = await response.json();
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.error('Get current user failed:', error);
    }

    return null;
  }

  // 管理员登录
  async login(username, password) {
    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // 如果需要 2FA
      if (data.requires2FA) {
        return { requires2FA: true, tempToken: data.tempToken };
      }

      // 直接登录成功
      this.setToken(data.token, data.expiresIn);
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // 验证 2FA
  async verify2FA(tempToken, code) {
    try {
      const response = await fetch('/api/auth?action=verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '2FA verification failed');
      }

      this.setToken(data.token, data.expiresIn);
      return { success: true };

    } catch (error) {
      console.error('2FA error:', error);
      throw error;
    }
  }

  // 登出
  async logout() {
    try {
      await fetch('/api/auth?action=logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.getToken()}` }
      });
    } finally {
      this.clear();
    }
  }

  // 清除认证信息
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }

  // 解析过期时间字符串
  parseExpiresIn(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 4 * 60 * 60 * 1000; // 默认 4 小时

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 4 * 60 * 60 * 1000;
    }
  }

  // 获取授权头
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

// 导出单例
export const authManager = new AuthManager();
export default authManager;
