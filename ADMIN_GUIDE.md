# ENS Manager 管理员部署指南

## 📋 目录结构

```
/workspace
├── admin/
│   ├── login.html        # 管理员登录页面
│   └── dashboard.html    # 卡密管理后台
├── api/
│   ├── auth/             # 认证 API
│   └── card-managers/    # 卡密管理员 API
└── scripts/
    └── init-db.sql       # 数据库初始化脚本
```

## 🚀 快速部署

### 1. 初始化数据库

在 Supabase SQL Editor 中运行：

```bash
# 复制 scripts/init-db.sql 内容并执行
```

这会创建：
- `profiles` 表 - 用户扩展信息
- `card_managers` 表 - 卡密管理员权限
- `card_keys` 表 - 卡密数据
- RLS 安全策略

### 2. 配置环境变量

仅需配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SITE_URL=https://yourdomain.com
```

### 3. 创建管理员账户

#### 方法一：创建超级管理员

1. 通过前台注册一个普通账户
2. 在 Supabase SQL Editor 执行：

```sql
-- 获取用户 ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- 提升为管理员
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

#### 方法二：创建卡密管理员

```sql
-- 先注册用户（通过前台或 Supabase Auth）
-- 然后添加卡密管理员权限
INSERT INTO card_managers (id, email, status, allowed_actions)
VALUES (
  '用户-UUID', 
  'manager@example.com', 
  true, 
  '{"generate": true, "view": false, "edit": false, "delete": false}'
);
```

### 4. 访问后台

- 登录页面：`https://yourdomain.com/admin/login.html`
- 管理后台：`https://yourdomain.com/admin/dashboard.html`

## 🔐 角色权限说明

| 角色 | 登录后台 | 生成卡密 | 查看卡密 | 编辑卡密 | 删除卡密 | 用户管理 |
|------|---------|---------|---------|---------|---------|---------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| card_manager | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 📡 API 接口

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/logout` | POST | 登出 |

### 卡密管理员相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/card-managers/check` | GET | 检查是否为卡密管理员 |
| `/api/card-managers/generate` | POST | 生成卡密 |
| `/api/card-managers/stats` | GET | 获取统计信息 |

### 卡密规则相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/cards/rules` | GET | 获取卡密规则列表 |
| `/api/auth/cards/groups` | GET | 获取卡密分组列表 |

## 🔧 常见问题

### Q1: 如何限制卡密管理员只能生成，不能查看？

默认配置已经限制：

```json
{
  "generate": true,
  "view": false,
  "edit": false,
  "delete": false
}
```

如需修改权限：

```sql
UPDATE card_managers 
SET allowed_actions = '{"generate": true, "view": true, "edit": false, "delete": false}'
WHERE email = 'manager@example.com';
```

### Q2: 卡密管理员能看到其他管理员生成的卡密吗？

不能。RLS 策略限制了卡密管理员只能看到自己生成的卡密。

### Q3: 如何禁用某个卡密管理员？

```sql
UPDATE card_managers SET status = false WHERE email = 'manager@example.com';
```

### Q4: 如何查看卡密生成记录？

```sql
SELECT * FROM operation_logs 
WHERE action = 'CARD_GENERATE' 
ORDER BY created_at DESC;
```

## 🛡️ 安全建议

1. **开启 RLS**: 所有敏感表都应开启 Row Level Security
2. **最小权限原则**: 卡密管理员只给必要的权限
3. **定期审计**: 检查 `operation_logs` 表
4. **HTTPS**: 生产环境必须使用 HTTPS
5. **域名限制**: 配置 ALLOWED_DOMAINS 防止跨站攻击

## 📊 监控与日志

系统自动记录以下操作：

- `USER_LOGIN` - 用户登录
- `USER_REGISTER` - 用户注册
- `USER_LOGOUT` - 用户登出
- `CARD_GENERATE` - 卡密生成

查询日志：

```sql
SELECT * FROM operation_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## 🎯 下一步优化

- [ ] 完整后台管理界面（用户管理、RPC 管理）
- [ ] 批量导入导出卡密
- [ ] 卡密使用情况统计
- [ ] 邮件通知系统
- [ ] API 限流增强

---

**文档版本**: v2.0  
**最后更新**: 2024
