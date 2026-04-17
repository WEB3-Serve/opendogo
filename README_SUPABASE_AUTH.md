# ENS Manager - Supabase Auth 版部署指南

## 📋 目录

* 功能特性
* 技术架构
* 部署步骤
* 环境变量配置
* 数据库设计
* 权限系统（重要）
* API 接口说明
* 常见问题

---

## ✨ 功能特性（已升级）

### 🔐 认证系统（Supabase Auth）

* ✅ 邮箱注册 / 登录
* ✅ 邮箱验证（自动发送）
* ✅ JWT Token（自动管理）
* ✅ Session 自动刷新
* ✅ OAuth 登录（Google / GitHub）

---

### 👥 用户系统（重构）

* 用户注册（自助）
* 用户资料表（profiles）
* 用户角色（admin / user）
* 用户分组

---

### 🔗 RPC 管理

* RPC 节点池
* 自动健康检测
* 负载均衡
* 故障转移

---

### 📊 仪表盘

* 用户增长统计
* 查询统计
* 系统状态

---

### 🌐 ENS 查询

* 批量查询
* RPC 轮询
* 缓存优化

---

## 🏗️ 技术架构（更新）

```
Frontend (HTML/JS)
   ↓
Supabase Auth（认证）
   ↓
Cloudflare Workers（业务 API）
   ↓
Supabase Database（数据）
```

---

## 🚀 部署步骤（新版）

### 1️⃣ 创建 Supabase 项目

进入 [Supabase 控制台](https://supabase.com)：

1. 创建新项目
2. 获取：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

---

### 2️⃣ 开启认证功能

进入：**Authentication → Providers**

开启：
- **Email**（默认开启）
- **Google**（可选）
- **GitHub**（可选）

---

### 3️⃣ 配置邮箱验证

进入：**Authentication → Email Templates**

可自定义：
- 注册确认邮件
- 重置密码邮件

---

### 4️⃣ 运行数据库初始化脚本

进入：**SQL Editor**，运行 `scripts/init-db.sql` 中的 SQL 脚本

该脚本会创建：
- `profiles` 表（用户扩展表）
- 自动创建 profile 的触发器
- Row Level Security 策略
- 其他业务表

---

### 5️⃣ 配置环境变量

在 Cloudflare Workers 中设置以下环境变量：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SITE_URL=https://your-domain.com
```

---

## 🔑 环境变量（精简版）

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SITE_URL` | 网站 URL（用于密码重置回调） | ❌ |

---

⚠️ **已删除的环境变量：**

- `ADMIN_ACCOUNT` ❌
- `ADMIN_PASSWORD` ❌
- `ADMIN_2FA_SECRET` ❌
- `JWT_SECRET` ❌

👉 不再需要，由 Supabase Auth 统一管理

---

## 🗄️ 数据库设计（重要）

### 用户扩展表（必须建）

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- user, admin, super_admin
  card_key VARCHAR(64) UNIQUE,
  group_id UUID,
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 自动创建用户资料

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 🔐 权限系统（替代原 admin 登录）

### 推荐设计：

| 角色          | 权限   |
| ----------- | ---- |
| `user`        | 普通用户 |
| `admin`       | 后台管理 |
| `super_admin` | 全权限  |

---

### 判断是否管理员：

```js
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role === 'admin' || profile?.role === 'super_admin') {
  // 管理员权限
}
```

---

## 🛡️ Row Level Security（强烈建议开启）

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 管理员可以查看所有 profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
```

---

## 📡 API 接口说明

### ✅ 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth?action=login` | 用户登录 |
| POST | `/api/auth?action=register` | 用户注册 |
| POST | `/api/auth?action=logout` | 用户登出 |
| GET | `/api/auth?action=me` | 获取当前用户信息 |
| POST | `/api/auth?action=refresh` | 刷新 Token |
| POST | `/api/auth?action=reset-password` | 重置密码 |

---

### 登录示例

```js
const response = await fetch('/api/auth?action=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const result = await response.json()
// result.data.token - access_token
// result.data.refresh_token - refresh_token
// result.data.user - 用户信息
```

---

### 注册示例

```js
const response = await fetch('/api/auth?action=register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    username: 'username'  // 可选
  })
})
```

---

### 获取用户信息

```js
const response = await fetch('/api/auth?action=me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

const result = await response.json()
// result.data.user - 用户完整信息
```

---

### 刷新 Token

```js
const response = await fetch('/api/auth?action=refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refresh_token: refreshToken
  })
})
```

---

## ⚠️ 安全配置（新版重点）

### ✅ 必做：

1. **开启 RLS** - 保护数据安全
2. **限制 API 必须带 JWT** - 所有业务接口验证 token
3. **使用 HTTPS** - 生产环境必须

---

### ⚠️ 可选：

- Cloudflare Turnstile（防注册攻击）
- 邮箱白名单（限制注册）
- OAuth 登录（Google/GitHub）

---

## ❓ 常见问题（新版）

### Q1：需要验证码注册吗？

👉 **不需要**  
Supabase 已自带邮箱验证，注册后会自动发送确认邮件

---

### Q2：还能用 2FA 吗？

👉 **可以（但要自己加）**  
Supabase 默认不带 Google Authenticator，但可以集成 TOTP

---

### Q3：如何创建管理员？

👉 **手动修改数据库：**

```sql
UPDATE profiles SET role = 'admin'
WHERE email = '你的邮箱';
```

或者在 Supabase 控制台 → Authentication → Users 找到用户，然后到 profiles 表修改 role 字段

---

### Q4：如何限制后台访问？

👉 **用 role + 前端判断 + API 校验**

```js
// 前端判断
if (profile.role !== 'admin') {
  window.location.href = '/'
}

// API 校验
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single()

if (profile?.role !== 'admin') {
  throw new Error('Unauthorized')
}
```

---

### Q5：如何处理未验证邮箱的用户？

👉 检查 `needsConfirmation` 标志：

```js
const result = await register(...)
if (result.needsConfirmation) {
  // 提示用户检查邮箱
}
```

---

## 🧠 架构变化总结

| 旧方案      | 新方案           |
| -------- | ------------- |
| 自建登录     | Supabase Auth |
| JWT 自己生成 | Supabase 自动生成 |
| 2FA 登录   | 可选（需自行实现） |
| 管理员账号写死  | role 字段控制 |
| 密码哈希自己处理 | Supabase 处理 |
| 登录 API   | Supabase Auth API |

---

## ✅ 最终效果

你现在拥有：

- ✅ 完整用户系统（无需后端登录代码）
- ✅ 自动 JWT 鉴权
- ✅ 安全性更高
- ✅ 架构更简单
- ✅ 可扩展 SaaS 系统

---

## 🎯 卡密管理员模块（新增）

### 角色说明

| 角色 | 权限 | 访问界面 |
|------|------|---------|
| admin / super_admin | 全部权限 | 完整后台 |
| card_manager | 仅生成卡密 | 卡密管理后台 |
| user | 普通用户 | 前台查询 |

### 创建卡密管理员

1. 在 Supabase Auth 中创建用户（注册或登录）
2. 获取用户的 UUID
3. 执行 SQL 添加卡密管理员权限：

```sql
INSERT INTO card_managers (id, email, status, allowed_actions)
VALUES ('用户 UUID', 'manager@example.com', true, 
        '{"generate": true, "view": false, "edit": false, "delete": false}');
```

### 卡密管理员 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/card-managers/check` | GET | 检查是否为卡密管理员 |
| `/api/card-managers/generate` | POST | 生成卡密 |
| `/api/card-managers/stats` | GET | 获取统计信息 |

### 访问后台

- 登录页面：`/admin/login.html`
- 管理后台：`/admin/dashboard.html`
- 仅限 admin/super_admin 或 card_manager 角色访问

---

## 📞 技术支持

如需进一步优化：

- 完整后台管理（RBAC）
- RPC 调度系统
- 批量导入导出
- OAuth 集成

请查阅官方文档或联系技术支持。
