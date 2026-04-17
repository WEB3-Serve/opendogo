# 🚀 ENS Manager - 快速部署指南

## ✅ 已完成配置

您的 Supabase 连接信息已配置完成！

---

## 📋 下一步操作（按顺序执行）

### 第 1 步：初始化数据库 ⭐⭐⭐

1. 打开 Supabase 控制台：https://yxulnfkndzjztqqtpgnm.supabase.co
2. 登录您的账号
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**
5. 复制 `/workspace/scripts/init-db-final.sql` 文件的全部内容
6. 粘贴到 SQL Editor
7. 点击 **Run** (或按 Ctrl+Enter)

✅ 看到 "Success. No rows returned" 表示成功！

---

### 第 2 步：创建管理员账号

在同一个 SQL Editor 中，运行以下命令（替换为您的邮箱）：

```sql
-- 方法 A: 如果您已经注册了账号，提升为 super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- 方法 B: 创建卡密管理员（只有生成权限）
-- 先获取用户 ID（需要先注册登录）
-- 然后运行：
INSERT INTO card_managers (id, email, status, allowed_actions)
VALUES ('用户-UUID', 'manager@example.com', true, 
        '{"generate": true, "view": false, "edit": false, "delete": false}');
```

---

### 第 3 步：配置 Vercel 环境变量

登录 Vercel → 选择项目 → Settings → Environment Variables

**添加以下变量：**

| Name | Value | Environments |
|------|-------|-------------|
| `SUPABASE_URL` | `https://yxulnfkndzjztqqtpgnm.supabase.co` | Production, Preview, Development |
| `SUPABASE_KEY` | `sb_publishable_W7yTR46_iifpnLDVQHyPtw_hiK5OPWN` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | *(从 Supabase 获取)* | Production, Preview, Development |

**获取 SERVICE_ROLE_KEY：**
1. Supabase 控制台 → Settings → API
2. 复制 **service_role** key (⚠️ 保密！不要泄露)

**删除以下旧变量（如果有）：**
- ❌ `ADMIN_ACCOUNT`
- ❌ `ADMIN_PASSWORD`
- ❌ `ADMIN_2FA_SECRET`
- ❌ `JWT_SECRET`
- ❌ `ALLOWED_DOMAINS`
- ❌ `UNAUTHORIZED_REDIRECT_URL`

---

### 第 4 步：注册第一个管理员账号

1. 访问您的网站前台（本地：http://localhost:3000）
2. 点击 **注册**
3. 输入管理员邮箱和密码
4. 检查邮箱，点击验证链接
5. 回到第 2 步，运行 SQL 将该邮箱提升为 `super_admin`

---

### 第 5 步：测试后台登录

访问：`/admin/login.html`

- 使用刚才创建的管理员账号登录
- 如果是 `super_admin`：可以看到所有功能
- 如果是 `card_manager`：只能看到卡密生成功能

---

## 🔐 角色权限说明

| 角色 | 登录后台 | 生成卡密 | 查看/编辑/删除 | 系统配置 |
|------|---------|---------|---------------|---------|
| `user` | ❌ | ❌ | ❌ | ❌ |
| `card_manager` | ✅ | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ❌ |
| `super_admin` | ✅ | ✅ | ✅ | ✅ |

---

## 📁 重要文件位置

- 数据库脚本：`/workspace/scripts/init-db-final.sql`
- 环境变量：`/workspace/.env.local`
- 管理员登录：`/admin/login.html`
- 卡密管理：`/admin/dashboard.html`

---

## ⚠️ 常见问题

### Q: 登录后提示 "Unauthorized"？
A: 确保该用户在 `profiles` 表中的 `role` 字段不是 `'user'`，需要是 `'admin'` 或 `'super_admin'`

### Q: 卡密管理员看不到生成界面？
A: 检查 `card_managers` 表中 `status` 是否为 `true`

### Q: 如何修改系统配置（RPC URL 等）？
A: 以 `super_admin` 身份登录后，在后台设置页面修改，或直接更新 `system_settings` 表

### Q: 数据会丢失吗？
A: 不会！所有数据存储在 Supabase 数据库中，代码更新不会影响数据

---

## 🎯 完成标志

✅ 数据库表已创建（8 张表）  
✅ 管理员账号已创建  
✅ 可以成功登录后台  
✅ 卡密生成功能正常  

---

需要帮助？检查 Supabase 控制台的 Logs 查看错误信息！
