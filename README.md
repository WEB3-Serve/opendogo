# ENS Manager - 完整架构方案

## 📁 项目结构

```
/workspace
├── index.html                  # 🏠 首页（产品入口 / SEO 页面）
├── ens.html                    # 🔎 ENS 查询页面（核心功能页）
├── admin/
│   └── index.html             # 🧠 管理后台入口
├── dashboard/                 # 👤 用户面板（待开发）
├── billing/                   # 💰 计费系统页面（待开发）
│
├── api/                       # 🚨 Vercel Serverless API 层（7 个文件，未超 12 个限制）
│   ├── auth.js               # 🔐 登录 / 2FA / token 管理
│   ├── rpc.js                # ⚡ ENS 查询业务统一入口
│   ├── users.js              # 👤 用户管理 CRUD
│   ├── cards.js              # 💳 卡密生成 / 管理
│   ├── billing.js            # 💰 计费 / 余额 / 消费
│   ├── admin.js              # 🧠 仪表盘 / 配置 / 公告 / 日志
│   └── logs.js               # 📜 日志查询接口
│
├── web/                       # 🌐 前端逻辑层（纯 JS 模块）
│   ├── lib/
│   │   ├── supabase-client.js   # 🔗 Supabase 前端 SDK 封装
│   │   ├── auth.js              # 🔐 JWT / Session 管理
│   │   └── permissions.js       # 🛡 RBAC 权限控制
│   └── guards/
│       ├── requireAuth.js       # 🚪 登录拦截器
│       └── requireRole.js       # 🔒 角色权限拦截
│
├── supabase/                  # 🧠 数据库配置
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # 📦 数据库表结构
│   └── policies/
│       └── rls_policies.sql    # 🔐 行级安全策略
│
├── vercel.json                 # ⚙️ Vercel 部署配置
└── .env.example                # 🔑 环境变量示例
```

---

## 🗄️ 数据库设计 (Supabase PostgreSQL)

### 核心数据表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `admins` | 管理员表 | username, password_hash, two_factor_secret, role |
| `users` | 用户表 | card_key, group_id, expires_at, query_count, balance |
| `user_groups` | 用户分组 | name, permissions, daily_limit |
| `card_keys` | 卡密表 | card_key, rule_id, status, used_by, expires_at |
| `card_rules` | 卡密规则 | valid_days, max_queries_per_day, price |
| `card_groups` | 卡密分组 | name, description |
| `rpc_nodes` | RPC 节点 | url, priority, weight, health_status, success_rate |
| `rpc_groups` | RPC 分组 | strategy (round_robin/weighted/priority) |
| `operation_logs` | 操作日志 | admin_id, action, resource, details |
| `api_logs` | API 日志 | endpoint, method, status_code, response_time |
| `query_logs` | 查询记录 | user_id, domains, result_count, cost |
| `system_configs` | 系统配置 | config_key, config_value (JSONB) |
| `announcements` | 公告表 | title, content, type, is_published |
| `billing_records` | 计费记录 | user_id, type, amount, balance_before/after |

### RLS 安全策略
- 所有表启用 Row Level Security
- 管理员通过 `is_admin()` 函数鉴权
- 用户只能访问自己的数据
- 敏感操作记录审计日志

---

## 🔌 API 接口规范

### 认证接口 `/api/auth`
```
POST /api/auth?action=login          # 账号密码登录
POST /api/auth?action=verify-2fa     # 验证 2FA 码
POST /api/auth?action=logout         # 登出
GET  /api/auth?action=me             # 获取当前用户
```

### ENS 查询 `/api/rpc`
```
POST /api/rpc?action=query           # ENS 批量查询
GET  /api/rpc?action=rpc-nodes       # 获取 RPC 节点列表
POST /api/rpc?action=verify-card     # 验证卡密
POST /api/rpc?action=activate-card   # 激活卡密
```

### 用户管理 `/api/users`
```
GET  /api/users                      # 用户列表（分页/搜索）
POST /api/users?action=create        # 创建用户
PUT  /api/users?id=xxx               # 更新用户
DELETE /api/users?id=xxx             # 删除用户
GET  /api/users?action=groups        # 用户分组列表
```

### 卡密管理 `/api/cards`
```
GET  /api/cards                      # 卡密列表
POST /api/cards?action=generate      # 批量生成卡密
POST /api/cards?action=rules         # 创建卡密规则
PUT  /api/cards?id=xxx               # 更新卡密
DELETE /api/cards?id=xxx             # 删除卡密
GET  /api/cards?action=rules         # 卡密规则列表
GET  /api/cards?action=groups        # 卡密分组列表
```

### 管理后台 `/api/admin`
```
GET  /api/admin?action=stats         # 仪表盘统计数据
GET  /api/admin?action=site-config   # 网站配置
PUT  /api/admin?action=site-config   # 更新网站配置
GET  /api/admin?action=announcements # 公告列表
POST /api/admin?action=announcement  # 发布公告
GET  /api/admin?action=operation-logs# 操作日志
GET  /api/admin?action=api-logs      # API 日志
GET  /api/admin?action=rpc-stats     # RPC 节点统计
```

### 计费系统 `/api/billing`
```
GET  /api/billing?action=balance     # 获取余额
GET  /api/billing?action=records     # 计费记录
POST /api/billing?action=charge      # 充值
POST /api/billing?action=consume     # 消费扣款
```

### 日志查询 `/api/logs`
```
GET /api/logs?type=operation         # 操作日志
GET /api/logs?type=api               # API 日志
GET /api/logs?type=query             # 查询日志
GET /api/logs?type=error             # 错误日志
```

---

## 🔐 安全机制

### 1. 双因子认证流程
```
1. 输入账号密码 → POST /api/auth?action=login
2. 验证通过返回 tempToken + requires2FA 标志
3. 输入 Google Authenticator 验证码 → POST /api/auth?action=verify-2fa
4. 验证通过返回正式 JWT token
5. 后续请求携带 Authorization: Bearer <token>
```

### 2. JWT Token 结构
```json
{
  "sub": "admin-uuid",
  "username": "admin",
  "role": "super_admin",
  "permissions": ["user:read", "user:write", "card:generate"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 3. 限流策略
- 全局限流：1000 请求/分钟
- 单 IP 限流：100 请求/分钟  
- 单用户限流：根据卡密规则
- 敏感接口：10 请求/分钟

### 4. RBAC 权限模型
| 角色 | 权限范围 |
|------|----------|
| super_admin | 所有权限 |
| admin | 除超级管理员设置外的所有权限 |
| operator | 用户查看、卡密生成、日志查看 |
| viewer | 只读权限 |

---

## 🚀 部署配置

### Vercel 环境变量
```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=4h

# 管理员账号（首次初始化用）
ADMIN_ACCOUNT=admin
ADMIN_PASSWORD=change-this-password-immediately
ADMIN_2FA_SECRET=JBSWY3DPEHPK3PXP

# RPC 配置
ENS_RPC_ENDPOINT=https://cloudflare-eth.com
RPC_TIMEOUT=5000
RPC_MAX_RETRIES=3

# 限流配置
RATE_LIMIT_GLOBAL=1000
RATE_LIMIT_PER_IP=100
RATE_LIMIT_PER_USER=50
```

### vercel.json 配置
```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": { "maxDuration": 10 }
  },
  "headers": [{
    "source": "/api/(.*)",
    "headers": [
      { "key": "Access-Control-Allow-Credentials", "value": "true" },
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
      { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization" }
    ]
  }],
  "rewrites": [
    { "source": "/admin", "destination": "/admin/index.html" },
    { "source": "/dashboard", "destination": "/dashboard/index.html" }
  ]
}
```

---

## 📋 部署步骤

### 1. Supabase 初始化
```sql
-- 在 Supabase SQL Editor 中执行
-- 1. 运行 supabase/migrations/001_initial_schema.sql
-- 2. 运行 supabase/policies/rls_policies.sql
```

### 2. 创建初始管理员
```sql
-- 生成 bcrypt 密码哈希后插入
INSERT INTO admins (username, password_hash, role, two_factor_secret) 
VALUES ('admin', '$2b$10$...', 'super_admin', 'JBSWY3DPEHPK3PXP');
```

### 3. Vercel 部署
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录并部署
vercel login
vercel --prod

# 3. 设置环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... 其他变量
```

### 4. 添加 RPC 节点
```sql
INSERT INTO rpc_nodes (name, url, priority, weight, status, health_status) 
VALUES 
('Cloudflare', 'https://cloudflare-eth.com', 10, 1, true, 'healthy'),
('Infura', 'https://mainnet.infura.io/v3/YOUR_KEY', 5, 2, true, 'healthy');
```

---

## 🛠️ 开发指南

### 前端调用示例
```javascript
import { authManager } from './web/lib/auth.js';
import { permissionManager } from './web/lib/permissions.js';

// 登录
await authManager.login('admin', 'password');

// 检查权限
await permissionManager.init();
if (permissionManager.can('generateCards')) {
  // 显示生成卡密按钮
}

// 调用 API
const stats = await fetch('/api/admin?action=stats')
  .then(r => r.json());
console.log(stats.users.total);
```

### 后端 API 扩展
```javascript
// 新增 API 端点 /api/xxx.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // 业务逻辑...
}
```

---

## 📊 监控与运维

### 健康检查
- RPC 节点每 5 分钟自动检测
- 失败率 > 50% 自动标记为 unhealthy
- 自动切换到备用节点

### 日志审计
- 所有管理员操作记录到 `operation_logs`
- 所有 API 调用记录到 `api_logs`
- 支持按时间、用户、操作类型筛选

### 数据备份
- Supabase 自动每日备份
- 可配置 Point-in-Time Recovery
- 关键表变更触发器记录

---

## ⚠️ 注意事项

1. **API 数量限制**: Vercel Hobby 计划最多 12 个 Serverless Functions，当前使用 7 个
2. **环境变量安全**: 敏感信息必须通过 Vercel 环境变量配置，不要提交到 Git
3. **数据库索引**: 常用查询字段已建立索引，新增查询请考虑性能
4. **CORS 配置**: 生产环境建议限制允许的源
5. **日志脱敏**: 密码、token 等敏感信息不记录到日志
6. **定期清理**: 建议设置定时任务清理 90 天前的日志

---

## 📝 许可证

MIT License
