const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'dashboard:read',
    'users:read',
    'cards:read',
    'cards:activate',
    'rpc:read',
    'rpc:manage',
    'settings:read',
    'settings:write',
    'announcements:read',
    'announcements:write'
  ],
  operator: ['dashboard:read', 'users:read', 'cards:read', 'rpc:read']
};

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role;
    const perms = ROLE_PERMISSIONS[role] || [];
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }
    return res.status(403).json({ message: `Missing permission: ${permission}` });
  };
}

export { ROLE_PERMISSIONS };
