/**
 * 权限控制模块 - RBAC 前端判断
 */
import { authManager } from './auth.js';

// 权限定义
export const PERMISSIONS = {
  // 用户管理
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // 卡密管理
  CARD_READ: 'card:read',
  CARD_WRITE: 'card:write',
  CARD_DELETE: 'card:delete',
  CARD_GENERATE: 'card:generate',
  
  // RPC 管理
  RPC_READ: 'rpc:read',
  RPC_WRITE: 'rpc:write',
  RPC_DELETE: 'rpc:delete',
  
  // 系统配置
  CONFIG_READ: 'config:read',
  CONFIG_WRITE: 'config:write',
  
  // 日志查看
  LOGS_READ: 'logs:read',
  
  // 计费管理
  BILLING_READ: 'billing:read',
  BILLING_WRITE: 'billing:write',
  
  // 公告管理
  ANNOUNCEMENT_READ: 'announcement:read',
  ANNOUNCEMENT_WRITE: 'announcement:write'
};

// 角色权限映射
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // 所有权限
  admin: [
    PERMISSIONS.USER_READ, PERMISSIONS.USER_WRITE,
    PERMISSIONS.CARD_READ, PERMISSIONS.CARD_WRITE, PERMISSIONS.CARD_GENERATE,
    PERMISSIONS.RPC_READ, PERMISSIONS.RPC_WRITE,
    PERMISSIONS.CONFIG_READ, PERMISSIONS.CONFIG_WRITE,
    PERMISSIONS.LOGS_READ,
    PERMISSIONS.BILLING_READ, PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.ANNOUNCEMENT_READ, PERMISSIONS.ANNOUNCEMENT_WRITE
  ],
  operator: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CARD_READ, PERMISSIONS.CARD_GENERATE,
    PERMISSIONS.RPC_READ,
    PERMISSIONS.LOGS_READ,
    PERMISSIONS.BILLING_READ
  ],
  viewer: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CARD_READ,
    PERMISSIONS.RPC_READ,
    PERMISSIONS.LOGS_READ,
    PERMISSIONS.BILLING_READ
  ]
};

export class PermissionManager {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = [];
  }

  // 初始化用户权限
  async init() {
    this.currentUser = await authManager.getCurrentUser();
    
    if (this.currentUser) {
      this.userRole = this.currentUser.role || 'viewer';
      this.userPermissions = ROLE_PERMISSIONS[this.userRole] || [];
    }
    
    return this;
  }

  // 检查是否有指定权限
  hasPermission(permission) {
    if (!this.userPermissions) return false;
    return this.userPermissions.includes(permission);
  }

  // 检查是否有任一权限
  hasAnyPermission(permissions) {
    return permissions.some(p => this.hasPermission(p));
  }

  // 检查是否有所有权限
  hasAllPermissions(permissions) {
    return permissions.every(p => this.hasPermission(p));
  }

  // 检查是否是管理员
  isAdmin() {
    return this.userRole === 'admin' || this.userRole === 'super_admin';
  }

  // 检查是否是超级管理员
  isSuperAdmin() {
    return this.userRole === 'super_admin';
  }

  // 获取当前角色
  getRole() {
    return this.userRole;
  }

  // 获取所有权限
  getPermissions() {
    return [...this.userPermissions];
  }

  // 根据权限显示/隐藏元素
  setupElementVisibility() {
    document.querySelectorAll('[data-permission]').forEach(el => {
      const requiredPermission = el.getAttribute('data-permission');
      if (!this.hasPermission(requiredPermission)) {
        el.style.display = 'none';
      }
    });

    document.querySelectorAll('[data-role]').forEach(el => {
      const requiredRole = el.getAttribute('data-role');
      const allowedRoles = requiredRole.split(',');
      if (!allowedRoles.includes(this.userRole)) {
        el.style.display = 'none';
      }
    });
  }

  // 条件渲染辅助函数
  can(action) {
    const permissionMap = {
      viewUsers: PERMISSIONS.USER_READ,
      createUser: PERMISSIONS.USER_WRITE,
      editUser: PERMISSIONS.USER_WRITE,
      deleteUser: PERMISSIONS.USER_DELETE,
      viewCards: PERMISSIONS.CARD_READ,
      generateCards: PERMISSIONS.CARD_GENERATE,
      editCards: PERMISSIONS.CARD_WRITE,
      deleteCards: PERMISSIONS.CARD_DELETE,
      viewRpc: PERMISSIONS.RPC_READ,
      manageRpc: PERMISSIONS.RPC_WRITE,
      viewConfig: PERMISSIONS.CONFIG_READ,
      editConfig: PERMISSIONS.CONFIG_WRITE,
      viewLogs: PERMISSIONS.LOGS_READ,
      viewBilling: PERMISSIONS.BILLING_READ,
      manageBilling: PERMISSIONS.BILLING_WRITE,
      viewAnnouncements: PERMISSIONS.ANNOUNCEMENT_READ,
      manageAnnouncements: PERMISSIONS.ANNOUNCEMENT_WRITE
    };

    const permission = permissionMap[action];
    return permission ? this.hasPermission(permission) : false;
  }
}

// 导出单例
export const permissionManager = new PermissionManager();
export default permissionManager;

// 使用示例：
// await permissionManager.init();
// if (permissionManager.can('generateCards')) { ... }
// permissionManager.setupElementVisibility();
