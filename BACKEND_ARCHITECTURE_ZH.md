# 后台架构（单独文件，最终版）

> 本文件只描述“后台（Backend）”架构，不包含前端 UI/RPC 细节。

## 1. 后台目标
- 用户管理（注册/登录/封禁/角色）
- 卡密管理（批次、生成、兑换、撤销）
- 后台登录（账号密码 + 2FA）
- 域名访问控制（白名单 + 跳转 + 开关）
- 审计日志与风控

## 2. 技术建议
- API：NestJS / Next Route Handlers
- DB：PostgreSQL
- Cache/RateLimit：Redis
- 部署：Vercel + 外部 DB/Redis

## 3. 核心模块
1. `auth`：账号密码登录、2FA、token 刷新/注销
2. `user`：用户资料、状态、角色绑定
3. `license`：卡密批次、兑换、核销日志
4. `rbac`：角色、权限点、菜单权限
5. `domain_guard`：域名白名单策略
6. `audit`：操作审计、登录审计

## 4. 后台登录链路（强制 2FA）
- 登录页：`/admin/login`
- 步骤：
  1) 账号 + 密码
  2) 返回 `requires_2fa=true`
  3) 输入 TOTP
  4) 签发 `access_token` + `refresh_token`

API 建议：
- `POST /api/admin/auth/login-password`
- `POST /api/admin/auth/login-2fa`
- `POST /api/admin/auth/refresh`
- `POST /api/admin/auth/logout`

安全策略：
- `ADMIN_FORCE_2FA=true`
- 登录失败锁定（5 次 / 15 分钟）
- 2FA 密钥加密存储（`TOTP_ENCRYPTION_KEY`）

## 5. 域名访问控制（后台重点）

### 全局环境变量
- `DOMAIN_RESTRICTION_ENABLED=true`
- `ALLOWED_DOMAINS=admin.opendogo.com,api.opendogo.com,opendogo.vercel.app`
- `DOMAIN_FALLBACK_URL=https://opendogo.vercel.app`

### 模块化规则表 `system_domain_rules`
- `module_key`（admin/api/redeem/...）
- `enabled`
- `allowed_domains`（JSON）
- `fallback_url`
- `updated_by` / `updated_at`

### 判定规则
1. 若总开关关闭 -> 放行（仅应急）
2. 模块规则开启 -> 用模块白名单
3. 否则 -> 用全局白名单
4. 不命中：页面跳转 fallback，API 返回 403

## 6. 数据不丢失策略（发布相关）
- DB/Redis 使用外部托管
- migration 管理结构，不做 reset
- 发布前自动备份
- 卡密兑换事务 + 幂等键 + 唯一约束

## 7. 后台优化路线
### P0
- Auth 模块化
- RBAC 细粒度
- 卡密事务化
- 限流防爆破
- 审计日志全覆盖

### P1
- 风控规则引擎
- 安全策略后台可配
- 可观测性与告警

### P2
- 异步队列
- WAF/CDN
- 定期渗透测试

## 8. 环境变量清单（仅后台）
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `TOTP_ENCRYPTION_KEY`
- `ADMIN_FORCE_2FA`
- `DOMAIN_RESTRICTION_ENABLED`
- `ALLOWED_DOMAINS`
- `DOMAIN_FALLBACK_URL`

