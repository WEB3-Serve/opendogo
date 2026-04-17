/**
 * 登录拦截器 - 检查用户是否已登录
 */
import { authManager } from '../lib/auth.js';

export function requireAuth(options = {}) {
  const { 
    redirectTo = '/admin/index.html',
    onAuthenticated = null 
  } = options;

  return async function() {
    // 检查是否已认证
    if (!authManager.isAuthenticated()) {
      // 保存当前 URL 以便登录后跳转
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = redirectTo;
      return false;
    }

    // 获取用户信息
    const user = await authManager.getCurrentUser();
    
    if (!user) {
      authManager.clear();
      window.location.href = redirectTo;
      return false;
    }

    // 如果提供了认证成功回调
    if (onAuthenticated && typeof onAuthenticated === 'function') {
      onAuthenticated(user);
    }

    return true;
  };
}

// 页面加载时自动检查
export async function checkAuth(redirectTo = '/admin/index.html') {
  if (!authManager.isAuthenticated()) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return null;
  }

  const user = await authManager.getCurrentUser();
  
  if (!user) {
    authManager.clear();
    window.location.href = redirectTo;
    return null;
  }

  return user;
}

export default requireAuth;
