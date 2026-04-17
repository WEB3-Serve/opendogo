# ENS Manager - 完整架构方案

## 项目结构
```
/workspace
├── index.html              # 优化后的首页（现代化设计）
├── ens.html                # ENS 查询页面（保持原 UI 不变）
├── admin/                  # 管理后台
│   └── index.html          # 管理后台入口
├── api/                    # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js        # 登录接口
│   │   ├── verify-2fa.js   # 2FA 验证
│   │   └── logout.js       # 登出
│   ├── users/
│   │   ├── list.js         # 用户列表
│   │   ├── create.js       # 创建用户
│   │   ├── update.js       # 更新用户
│   │   ├── delete.js       # 删除用户
│   │   └── groups.js       # 用户分组
│   ├── cards/
│   │   ├── list.js         # 卡密列表
│   │   ├── generate.js     # 生成卡密
│   │   ├── rules.js        # 卡密规则
│   │   └── groups.js       # 卡密分组
│   ├── rpc/
│   │   ├── list.js         # RPC 节点列表
│   │   ├── health.js       # 健康检测
│   │   └── strategy.js     # 调度策略
│   ├── config/
│   │   ├── site.js         # 网站配置
│   │   ├── announcement.js # 公告管理
│   │   └── system.js       # 系统设置
│   ├── logs/
│   │   ├── operation.js    # 操作日志
│   │   ├── api.js          # 接口日志
│   │   └── error.js        # 错误日志
│   └── dashboard/
│       └── stats.js        # 仪表盘数据
├── lib/
│   ├── supabase.js         # Supabase 客户端
│   ├── auth.js             # 认证中间件
│   ├── rbac.js             # 权限控制
│   └── rate-limit.js       # 限流中间件
├── middleware/
│   ├── auth.js             # JWT 验证
│   ├── cors.js             # CORS 处理
│   └── logger.js           # 日志记录
├── scripts/
│   └── init-db.js          # 数据库初始化脚本
├── vercel.json             # Vercel 配置
├── wrangler.toml           # Cloudflare Workers 配置（可选）
└── .env.example            # 环境变量示例
```

## 核心功能模块

### 1. 认证系统
- **双因子登录**: 账号密码 + Google 验证码
- **JWT Token**: 自动续期，设备指纹验证
- **环境变量**: 
  - `ADMIN_ACCOUNT` - 管理员账号
  - `ADMIN_PASSWORD` - 管理员密码
  - `ADMIN_2FA_SECRET` - 2FA 密钥

### 2. 仪表盘（监控中心）
- 实时数据统计（用户数、卡密数、查询量）
- RPC 节点状态监控
- 异常告警看板
- 数据趋势图表

### 3. 用户管理
- **用户列表**: 分页查询、搜索、筛选
- **用户分组**: 自定义分组、批量操作
- **激活记录**: 完整审计日志

### 4. 卡密管理
- **卡密列表**: 批量生成、导出、状态管理
- **卡密规则**: 有效期、使用次数、绑定限制
- **卡密分组**: 分类管理、权限隔离
- **生命周期**: 激活、冻结、过期、回收

### 5. RPC 管理
- **RPC 节点池**: 多节点配置、负载均衡
- **健康检测**: 自动检测、故障转移
- **调度策略**: 轮询、权重、优先级
- **缓存机制**: Redis 缓存、降低调用成本

### 6. 网站管理
- **网站配置**: SEO、主题、功能开关
- **公告管理**: 发布、编辑、定时上下架
- **SEO 配置**: TDK 管理、sitemap

### 7. 系统设置
- **基础设置**: 站点信息、联系方式
- **安全设置**: IP 白名单、登录保护
- **接口设置**: API 密钥、速率限制

### 8. 日志系统
- **操作日志**: 管理员操作记录
- **接口日志**: API 调用追踪
- **错误日志**: 异常堆栈、告警通知

### 9. 风控系统
- **限流**: 基于 IP、用户、接口的多维度限流
- **异常检测**: 频率异常、行为分析

### 10. 权限系统
- **RBAC**: 角色 - 权限模型
- **细粒度控制**: 菜单级、按钮级权限

### 11. 任务系统
- **定时任务**: 数据清理、报表生成
- **异步队列**: 批量操作、邮件发送

## 数据库设计 (Supabase PostgreSQL)

### 核心表结构
```sql
-- 管理员表
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin',
  status BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  card_key VARCHAR(64) UNIQUE,
  group_id UUID REFERENCES user_groups(id),
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户分组表
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 卡密表
CREATE TABLE card_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key VARCHAR(64) UNIQUE NOT NULL,
  rule_id UUID REFERENCES card_rules(id),
  group_id UUID REFERENCES card_groups(id),
  status VARCHAR(20) DEFAULT 'active', -- active/used/expired/frozen
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 卡密规则表
CREATE TABLE card_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  valid_days INTEGER DEFAULT 30,
  max_queries_per_day INTEGER DEFAULT 100,
  allow_batch BOOLEAN DEFAULT true,
  max_batch_size INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RPC 节点表
CREATE TABLE rpc_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  group_id UUID REFERENCES rpc_groups(id),
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 1,
  status BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP,
  health_status VARCHAR(20) DEFAULT 'unknown',
  avg_response_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 接口日志表
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  request_data JSONB,
  response_data JSONB,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API 接口规范

### 认证接口
```
POST /api/auth/login         # 账号密码登录
POST /api/auth/verify-2fa    # 验证 2FA
POST /api/auth/logout        # 登出
GET  /api/auth/me            # 获取当前用户信息
```

### 用户管理
```
GET    /api/users            # 用户列表（分页、筛选）
POST   /api/users            # 创建用户
PUT    /api/users/:id        # 更新用户
DELETE /api/users/:id        # 删除用户
POST   /api/users/batch      # 批量操作
GET    /api/users/groups     # 用户分组列表
```

### 卡密管理
```
GET    /api/cards            # 卡密列表
POST   /api/cards/generate   # 批量生成卡密
PUT    /api/cards/:id        # 更新卡密
DELETE /api/cards/:id        # 删除卡密
GET    /api/cards/rules      # 卡密规则列表
POST   /api/cards/rules      # 创建规则
GET    /api/cards/groups     # 卡密分组列表
```

### RPC 管理
```
GET    /api/rpc/nodes        # RPC 节点列表
POST   /api/rpc/nodes        # 添加节点
PUT    /api/rpc/nodes/:id    # 更新节点
DELETE /api/rpc/nodes/:id    # 删除节点
POST   /api/rpc/health       # 手动健康检测
GET    /api/rpc/stats        # 节点统计数据
```

### 系统配置
```
GET    /api/config/site      # 网站配置
PUT    /api/config/site      # 更新网站配置
GET    /api/config/announcements  # 公告列表
POST   /api/config/announcements  # 发布公告
GET    /api/config/system    # 系统设置
PUT    /api/config/system    # 更新系统设置
```

### 日志查询
```
GET    /api/logs/operation   # 操作日志
GET    /api/logs/api         # 接口日志
GET    /api/logs/error       # 错误日志
```

### 仪表盘
```
GET    /api/dashboard/stats  # 统计数据
GET    /api/dashboard/chart  # 图表数据
```

## 安全机制

### 1. 双因子认证流程
```
1. 用户输入账号密码 → POST /api/auth/login
2. 验证通过返回临时 token + 需要 2FA 标志
3. 用户输入 Google 验证码 → POST /api/auth/verify-2fa
4. 验证通过返回正式 JWT token
5. 后续请求携带 JWT token
```

### 2. JWT Token 结构
```json
{
  "sub": "admin-uuid",
  "username": "admin",
  "role": "super_admin",
  "permissions": ["users:read", "users:write", ...],
  "iat": 1234567890,
  "exp": 1234571490,
  "device_fingerprint": "xxx"
}
```

### 3. 限流策略
- 全局限流：1000 请求/分钟
- 单 IP 限流：100 请求/分钟
- 单用户限流：根据卡密规则
- 敏感接口：10 请求/分钟

## 部署配置

### Vercel 环境变量
```bash
# 管理员账号
ADMIN_ACCOUNT=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_2FA_SECRET=JBSWY3DPEHPK3PXP

# Supabase 配置
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=4h
```

### vercel.json
```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
```

## 开发计划

### 第一阶段：基础架构（2 天）
- [ ] 项目初始化
- [ ] 数据库表创建
- [ ] 认证系统实现
- [ ] 基础中间件

### 第二阶段：管理后台（3 天）
- [ ] 左侧导航布局
- [ ] 仪表盘页面
- [ ] 用户管理 CRUD
- [ ] 卡密管理 CRUD

### 第三阶段：高级功能（3 天）
- [ ] RPC 管理系统
- [ ] 日志系统
- [ ] 风控限流
- [ ] 权限控制

### 第四阶段：首页优化（1 天）
- [ ] 现代化 Hero 区域
- [ ] 特性展示
- [ ] 公告模块
- [ ] 响应式适配

### 第五阶段：测试部署（1 天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 生产环境部署
- [ ] 性能优化

## 技术亮点

1. **Serverless 架构**: 零运维成本，自动扩缩容
2. **边缘计算**: 全球 CDN 加速，低延迟
3. **多级缓存**: Redis + 内存缓存，高性能
4. **安全加固**: 2FA + JWT + RBAC + 限流
5. **可观测性**: 完整日志 + 监控 + 告警
6. **自动化**: CI/CD 自动部署，定时任务

## 注意事项

1. **环境变量安全**: 敏感信息必须通过环境变量配置
2. **数据库索引**: 为常用查询字段建立索引
3. **错误处理**: 统一错误格式，避免信息泄露
4. **CORS 配置**: 严格限制允许的源
5. **日志脱敏**: 敏感数据不记录到日志
6. **备份策略**: 定期备份数据库
