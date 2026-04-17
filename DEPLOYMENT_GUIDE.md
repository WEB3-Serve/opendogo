# ENS Manager - Supabase Auth 最终版部署指南

## 📋 目录

1. [环境变量配置](#环境变量配置)
2. [数据库初始化](#数据库初始化)
3. [创建管理员](#创建管理员)
4. [部署步骤](#部署步骤)
5. [常见问题](#常见问题)

---

## 🔑 环境变量配置

### Vercel 环境变量设置

进入 Vercel 项目 → Settings → Environment Variables

**必须配置：**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**业务配置（可选，也可在后台设置）：**
```env
DEFAULT_RPC_URL=https://eth.llamarpc.com
SITE_URL=https://your-domain.com
```

### ❌ 已删除的环境变量

以下变量**不再需要**，请删除：
- `ADMIN_ACCOUNT` ❌
- `ADMIN_PASSWORD` ❌
- `ADMIN_2FA_SECRET` ❌
- `JWT_SECRET` ❌
- `ALLOWED_DOMAINS` ❌ (改为数据库配置)
- `UNAUTHORIZED_REDIRECT_URL` ❌ (改为数据库配置)

---

## 🗄️ 数据库初始化

### 步骤 1: 打开 Supabase SQL Editor

1. 登录 Supabase 控制台
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**

### 步骤 2: 运行初始化脚本

复制 `/workspace/scripts/init-db-final.sql` 的全部内容，粘贴到 SQL Editor 中，点击 **Run** 执行。

脚本会创建：
- ✅ `profiles` - 用户资料表
- ✅ `card_managers` - 卡密管理员表
- ✅ `card_keys` - 卡密钥表
- ✅ `card_rules` - 卡规则表
- ✅ `card_groups` - 卡分组表
- ✅ `user_groups` - 用户分组表
- ✅ `rpc_nodes` - RPC 节点表
- ✅ `rpc_groups` - RPC 分组表
- ✅ `system_settings` - 系统配置表
- ✅ `operation_logs` - 操作日志表
- ✅ `api_logs` - API 日志表
- ✅ 自动触发器和 RLS 策略
- ✅ 默认数据

### 步骤 3: 验证表结构

执行以下 SQL 检查表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 👤 创建管理员

### 方法 1: 通过 SQL 直接创建

1. 先在 Supabase Authentication → Users 注册用户
2. 复制用户的 UUID
3. 运行以下 SQL：

```sql
-- 提升为超级管理员
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- 或创建卡密管理员（只有生成权限）
INSERT INTO card_managers (id, email, status, allowed_actions)
VALUES (
  'user-uuid-from-auth', 
  'manager@example.com', 
  true, 
  '{"generate": true, "view": false, "edit": false, "delete": false}'
);
```

### 方法 2: 通过注册后手动提升

1. 访问网站前台注册账号
2. 在 Supabase SQL Editor 运行：

```sql
-- 查看刚注册的用户
SELECT id, email, role FROM profiles ORDER BY created_at DESC LIMIT 5;

-- 提升为 super_admin
UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

---

## 🚀 部署步骤

### 1. 准备 Supabase

- [x] 创建 Supabase 项目
- [x] 获取 `SUPABASE_URL` 和 `SUPABASE_KEY`
- [x] 运行数据库初始化脚本
- [x] 创建管理员账号

### 2. 配置 Vercel

- [x] 添加环境变量
- [x] 连接 GitHub 仓库
- [x] 部署项目

### 3. 验证功能

#### 测试注册/登录
1. 访问网站首页
2. 点击注册，填写邮箱和密码
3. 检查邮箱验证邮件（如开启）
4. 使用账号登录

#### 测试管理员登录
1. 访问 `/admin/login.html`
2. 使用管理员账号登录
3. 验证是否跳转到管理后台

#### 测试卡密生成
1. 在管理后台选择规则和数量
2. 点击生成卡密
3. 验证卡密是否正确生成

---

## 📊 系统配置

### 修改系统设置

超级管理员可以通过 SQL 修改系统配置：

```sql
-- 修改默认 RPC URL
UPDATE system_settings 
SET setting_value = 'https://new-rpc-url.com' 
WHERE setting_key = 'default_rpc_url';

-- 修改允许的域名
UPDATE system_settings 
SET setting_value = 'domain1.com,domain2.com' 
WHERE setting_key = 'allowed_domains';

-- 查看所有配置
SELECT * FROM system_settings;
```

---

## ❓ 常见问题

### Q1: 注册后无法登录？

**A:** 检查以下几点：
1. 邮箱是否已验证（如开启邮箱验证）
2. `profiles` 表是否有对应的记录
3. 浏览器控制台是否有错误信息

### Q2: 管理员无法登录后台？

**A:** 确认：
1. 用户角色是否为 `admin` 或 `super_admin`
2. 或者是否在 `card_managers` 表中
3. 检查浏览器控制台的权限错误

### Q3: 如何创建卡密管理员？

**A:** 运行以下 SQL：

```sql
-- 先获取用户 ID
SELECT id FROM profiles WHERE email = 'manager@example.com';

-- 插入 card_managers 表
INSERT INTO card_managers (id, email, status, allowed_actions)
VALUES ('user-id', 'manager@example.com', true, 
        '{"generate": true, "view": false, "edit": false, "delete": false}');
```

### Q4: 数据更新会丢失吗？

**A:** 不会！代码更新不会影响数据库中的数据。用户、卡密、配置等数据都会保留。

### Q5: 如何备份数据？

**A:** 在 Supabase 控制台：
1. 进入 **Database** → **Backups**
2. 启用自动备份
3. 或手动导出 CSV

---

## 🔐 权限说明

| 角色 | 登录后台 | 生成卡密 | 查看卡密 | 编辑卡密 | 删除卡密 | 系统配置 |
|------|---------|---------|---------|---------|---------|---------|
| user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| card_manager | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📁 文件结构

```
/workspace
├── scripts/
│   ├── init-db.sql          # 旧版数据库脚本
│   └── init-db-final.sql    # 最终版数据库脚本 ⭐
├── admin/
│   ├── login.html           # 管理员登录页面
│   └── dashboard.html       # 卡密管理后台
├── api/
│   ├── auth/
│   │   └── index.js         # 认证 API
│   └── card-managers/
│       └── index.js         # 卡密管理员 API
├── lib/
│   ├── supabase.js          # Supabase 客户端
│   └── response.js          # 响应工具
├── index.html               # 首页
├── ens.html                 # ENS 查询页
└── DEPLOYMENT_GUIDE.md      # 本部署指南
```

---

## 🎯 下一步

1. ✅ 运行数据库初始化脚本
2. ✅ 配置 Vercel 环境变量
3. ✅ 创建管理员账号
4. ✅ 测试注册/登录流程
5. ✅ 测试卡密生成功能
6. ✅ 配置系统设置

---

## 📞 技术支持

如有问题，请检查：
1. Supabase 控制台日志
2. Vercel 函数日志
3. 浏览器开发者工具控制台
