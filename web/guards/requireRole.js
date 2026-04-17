/**
 * 权限拦截器 - 检查用户是否有指定角色/权限
 */
import { authManager } from '../lib/auth.js';
import { permissionManager, ROLE_PERMISSIONS } from '../lib/permissions.js';

export function requireRole(options = {}) {
  const { 
    roles = [],           // 允许的角色列表 ['admin', 'super_admin']
    permissions = [],     // 需要的权限列表
    redirectTo = '/403.html',
    onAuthorized = null 
  } = options;

  return async function() {
    // 先检查登录状态
    if (!authManager.isAuthenticated()) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/admin/index.html';
      return false;
    }

    // 初始化权限管理器
    await permissionManager.init();

    // 检查角色
    if (roles.length > 0) {
      const userRole = permissionManager.getRole();
      if (!roles.includes(userRole)) {
        window.location.href = redirectTo;
        return false;
      }
    }

    // 检查权限
    if (permissions.length > 0) {
      if (!permissionManager.hasAllPermissions(permissions)) {
        window.location.href = redirectTo;
        return false;
      }
    }

    // 如果提供了授权成功回调
    if (onAuthorized && typeof onAuthorized === 'function') {
      onAuthorized(permissionManager);
    }

    // 设置元素可见性
    permissionManager.setupElementVisibility();

    return true;
  };
}

// 快捷方法：要求管理员权限
export const requireAdmin = () => requireRole({ 
  roles: ['admin', 'super_admin'] 
});

// 快捷方法：要求超级管理员权限
export const requireSuperAdmin = () => requireRole({ 
  roles: ['super_admin'] 
});

// 快捷方法：要求特定权限
export const requirePermission = (...perms) => requireRole({ 
  permissions: perms 
});

export default requireRole;
