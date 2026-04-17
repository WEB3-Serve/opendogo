# ENS Manager - 完整部署指南

## 📋 目录
- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [部署步骤](#部署步骤)
- [环境变量配置](#环境变量配置)
- [数据库初始化](#数据库初始化)
- [安全配置](#安全配置)
- [API 接口文档](#api-接口文档)
- [常见问题](#常见问题)

---

## ✨ 功能特性

### 🔐 安全认证系统
- **双重认证 (2FA)**: 账号密码 + Google Authenticator
- **域名授权**: 防止代码被盗用，仅允许指定域名访问
- **JWT Token**: 安全的会话管理
- **操作日志**: 完整的审计追踪

### 👥 用户管理
- 用户列表与分组
- 卡密系统（生成、规则、分组）
- 激活记录追踪
- 批量操作支持

### 🔗 RPC 管理
- 多 RPC 节点池
- 健康检测与自动故障转移
- 智能负载均衡
- 响应时间监控

### 📊 仪表盘
- 实时数据统计
- 查询趋势图表
- 系统健康状态
- 告警通知

### 🌐 ENS 查询
- 批量域名查询
- 缓存优化
- 多种 RPC 源支持
- 实时进度显示

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                 Frontend (HTML/CSS/JS)          │
│  • index.html (首页)                            │
│  • ens.html (查询页面)                          │
│  • admin/login.html (后台登录)                  │
│  • admin/dashboard.html (管理后台)              │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│         Vercel Serverless Functions             │
│  • /api/auth/* (认证)                           │
│  • /api/users/* (用户管理)                      │
│  • /api/cards/* (卡密管理)                      │
│  • /api/rpc/* (RPC 管理)                         │
│  • /api/ens/query (ENS 查询)                     │
│  • /api/config/* (配置管理)                     │
│  • /api/dashboard/* (仪表盘)                    │
│  • /api/logs/* (日志管理)                       │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│          Supabase (PostgreSQL)                  │
│  • admins (管理员)                              │
│  • users (用户)                                 │
│  • card_keys (卡密)                             │
│  • rpc_nodes (RPC 节点)                          │
│  • domain_authorizations (域名授权)             │
│  • operation_logs (操作日志)                    │
│  • api_logs (API 日志)                           │
│  • error_logs (错误日志)                        │
└─────────────────────────────────────────────────┘
```

---

## 🚀 部署步骤

### 1. 准备工作

#### 需要的账户
- [GitHub](https://github.com/) 账户
- [Vercel](https://vercel.com/) 账户
- [Supabase](https://supabase.com/) 账户
- Google Authenticator App

### 2. 创建 Supabase 项目

1. 登录 [Supabase](https://supabase.com/)
2. 创建新项目
3. 等待项目初始化完成
4. 进入 **SQL Editor**
5. 复制 `scripts/init-db.sql` 的全部内容并执行

### 3. 获取 Supabase 凭证

1. 进入项目 **Settings** → **API**
2. 记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

### 4. 生成 JWT 密钥

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -hex 32
```

或使用在线工具：https://generate-secret.vercel.app/32

### 5. 配置 Google 2FA

1. 安装 Google Authenticator App
2. 访问：https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=... (搜索 "Google Authenticator setup")
3. 或者使用在线工具生成密钥：
   ```bash
   # 生成 Base32 密钥
   openssl rand -base32 32
   ```
4. 在 Google Authenticator 中添加此密钥
5. 记录生成的密钥（用于 `ADMIN_2FA_SECRET`）

### 6. Fork 并部署到 Vercel

1. **Fork 仓库到你的 GitHub**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ens-manager.git
   cd ens-manager
   ```

2. **推送到你的 GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ens-manager.git
   git push -u origin main
   ```

3. **部署到 Vercel**
   - 登录 [Vercel](https://vercel.com/)
   - 点击 **Add New Project**
   - 选择你的 GitHub 仓库
   - 配置环境变量（见下一步）
   - 点击 **Deploy**

### 7. 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `JWT_SECRET` | JWT 签名密钥 | `a1b2c3d4e5f6...` (64 字符) |
| `ADMIN_ACCOUNT` | 管理员账号 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `YourSecurePassword123!` |
| `ADMIN_2FA_SECRET` | Google 2FA 密钥 | `JBSWY3DPEHPK3PXP...` (Base32) |
| `ALLOWED_DOMAINS` | 允许的域名（逗号分隔） | `opendogo.vercel.app,yourdomain.com` |
| `UNAUTHORIZED_REDIRECT_URL` | 未授权跳转 URL | `https://example.com/unauthorized` |
| `DEFAULT_RPC_URL` | 默认 RPC 节点 | `https://eth.llamarpc.com` |

**重要提示：**
- `ALLOWED_DOMAINS`: 如果不配置，所有域名都可以访问（开发模式）
- 生产环境**必须**配置此变量以防止盗用

### 8. 验证部署

1. 访问 `https://your-project.vercel.app`
2. 测试首页是否正常
3. 访问 `https://your-project.vercel.app/admin/login.html`
4. 使用配置的账号密码登录
5. 输入 Google Authenticator 中的 6 位验证码
6. 成功进入管理后台

---

## 🛡️ 安全配置

### 域名授权系统

域名授权系统防止他人盗用您的代码。工作原理：

1. **检查机制**:
   - 检查请求的 Host 头
   - 检查 Referer 头
   - 检查 Origin 头

2. **未授权处理**:
   - API 请求返回 403 错误
   - 前端页面显示未授权提示并自动跳转

3. **配置方法**:
   ```env
   ALLOWED_DOMAINS=opendogo.vercel.app,www.yourdomain.com
   UNAUTHORIZED_REDIRECT_URL=https://yourdomain.com/unauthorized
   ```

4. **数据库管理**:
   - 可通过 `/api/config/domain-auth` API 管理域名白名单
   - 支持添加、删除、启用/禁用域名

### 双因子认证流程

```
用户输入账号密码
       ↓
验证通过 → 生成临时 Token (5 分钟有效)
       ↓
弹出 2FA 输入框
       ↓
用户输入 Google Authenticator 验证码
       ↓
验证通过 → 生成正式 JWT Token
       ↓
进入管理后台
```

---

## 📡 API 接口文档

### 认证接口

#### POST /api/auth/login
登录（第一步：账号密码）

**请求体:**
```json
{
  "username": "admin",
  "password": "YourPassword"
}
```

**响应:**
```json
{
  "success": true,
  "message": "Credentials verified. Please enter 2FA code.",
  "data": {
    "tempToken": "eyJhbGc...",
    "requires2FA": true
  }
}
```

#### POST /api/auth/verify-2fa
验证 2FA（第二步）

**请求体:**
```json
{
  "tempToken": "eyJhbGc...",
  "code": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "2FA verification successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "username": "admin",
      "role": "super_admin"
    }
  }
}
```

### ENS 查询接口

#### POST /api/ens/query
批量查询 ENS 域名

**请求体:**
```json
{
  "domains": ["vitalik.eth", "ethereum.eth"],
  "rpcUrl": "https://eth.llamarpc.com"
}
```

**响应:**
```json
{
  "success": true,
  "message": "Query completed",
  "data": [
    {
      "domain": "vitalik.eth",
      "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "available": false,
      "queriedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/ens/query?domain=vitalik.eth
查询单个域名

**响应:**
```json
{
  "success": true,
  "message": "Query completed",
  "data": {
    "domain": "vitalik.eth",
    "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "available": false,
    "fromCache": false,
    "queriedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 域名授权管理

#### GET /api/config/domain-auth
获取所有授权域名

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "domain": "opendogo.vercel.app",
      "description": "主站",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/config/domain-auth
添加授权域名

**请求体:**
```json
{
  "domain": "newdomain.com",
  "description": "新站点",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

#### DELETE /api/config/domain-auth?id=uuid
删除授权域名

---

## ❓ 常见问题

### Q1: 登录后一直提示"Invalid 2FA code"？

**解决方案:**
1. 确保服务器时间同步（2FA 基于时间）
2. 检查 `ADMIN_2FA_SECRET` 是否正确
3. 重新生成密钥并在 Google Authenticator 中重新添加
4. 尝试使用当前时间的验证码（每 30 秒刷新）

### Q2: 域名授权不生效？

**解决方案:**
1. 检查环境变量 `ALLOWED_DOMAINS` 是否配置
2. 确认域名格式正确（不要包含 `http://` 或 `https://`）
3. 清除浏览器缓存后重试
4. 检查 Vercel 环境变量是否已重新部署生效

### Q3: ENS 查询返回错误？

**解决方案:**
1. 检查 RPC 节点是否可用
2. 尝试更换 `DEFAULT_RPC_URL`
3. 查看 `/api/logs/error` 中的错误日志
4. 确保 Supabase 连接正常

### Q4: 如何修改管理员密码？

**解决方案:**
直接修改 Vercel 环境变量 `ADMIN_PASSWORD`，然后重新部署：
```bash
vercel --prod
```

### Q5: 如何备份数据？

**解决方案:**
在 Supabase 控制台：
1. 进入 **Database** → **Backups**
2. 点击 **Create backup**
3. 下载 SQL 文件保存

---

## 📞 技术支持

如有问题，请提交 Issue 或联系开发者。

---

## 📝 更新日志

### v1.0.0 (2024)
- ✅ 完整的用户管理系统
- ✅ 卡密生成与管理
- ✅ RPC 节点池与调度
- ✅ 域名授权防泄露系统
- ✅ 双因子认证
- ✅ ENS 批量查询
- ✅ 仪表盘统计
- ✅ 完整的日志系统

---

**© 2024 ENS Manager. All rights reserved.**
