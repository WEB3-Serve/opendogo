# 最终版（继续优化后端）：前后端分开 + 后端登录链路 + RPC 前端化

> 你追加的要求：
> - 分开（前后端职责明确）
> - 后端登录链接、账号密码流程要清晰
> - 继续优化后端
> - RPC 放前端

---

## 1. 分开后的系统边界（最终确认）

## 前端（Web）
- 页面渲染与交互
- 钱包连接与链上只读 RPC
- 访问域名检查（不合法跳转）
- 调用后端 API（不做最终权限判断）

## 后端（Admin/API）
- 登录认证（账号密码 + 2FA）
- 用户管理、卡密管理、角色权限（RBAC）
- 审计日志、风控、限流
- 域名白名单强校验（API 入口）

> 结论：前端负责体验，后端负责安全与业务裁决。

---

## 2. 后端登录链接与登录方式（你要的重点）

### 后端登录链接（建议）
- 管理后台登录页：`https://admin.opendogo.com/login`
- 生产备用地址：`https://opendogo.vercel.app/admin/login`

> 上述两个地址都应纳入白名单配置。

### 登录方式（固定为账号密码 + 2FA）
1. 输入账号 + 密码；
2. 密码通过后，进入 2FA 验证页；
3. 输入 Google Authenticator 6 位码；
4. 验证通过后签发 Token；
5. 进入后台首页。

### 登录 API（建议）
- `POST /api/admin/auth/login-password`
  - 入参：`account`、`password`
  - 出参：`requires_2fa=true`、`login_ticket`
- `POST /api/admin/auth/login-2fa`
  - 入参：`login_ticket`、`totp_code`
  - 出参：`access_token`、`refresh_token`
- `POST /api/admin/auth/refresh`
- `POST /api/admin/auth/logout`

### 登录安全策略
- 账号密码错误锁定：5 次失败锁定 15 分钟
- 2FA 错误也计入风控计数
- `ADMIN_FORCE_2FA=true`：管理员必须绑定 2FA
- 记录登录日志：IP、UA、时间、结果

---

## 3. 域名验证（模块级）

你指定的三项必须支持：
- ✔ 域名白名单
- ✔ 跳转域名
- ✔ 是否开启域名限制

### 数据表（建议）`system_domain_rules`
- `module_key`：`admin/api/web/redeem`
- `enabled`：是否启用限制
- `allowed_domains`：白名单数组
- `fallback_url`：非法域名跳转地址
- `updated_by`、`updated_at`

### 全局变量
- `DOMAIN_RESTRICTION_ENABLED=true`
- `ALLOWED_DOMAINS=opendogo.vercel.app,admin.opendogo.com,api.opendogo.com`
- `DOMAIN_FALLBACK_URL=https://opendogo.vercel.app`

### 判定顺序
1. 先看总开关 `DOMAIN_RESTRICTION_ENABLED`
2. 再看模块规则 `system_domain_rules`
3. 没有模块规则则回退全局 `ALLOWED_DOMAINS`
4. 未命中时：
   - 页面：302/307 到 fallback URL
   - API：403 拒绝

---

## 4. 继续优化后端（重点优化项）

## P0（立刻做）
1. **认证中心拆分**：`auth` 独立模块，统一签发/刷新/撤销 token
2. **RBAC 细粒度权限**：菜单 + API 权限点，默认拒绝
3. **卡密事务化**：兑换必须事务 + 幂等键 + 唯一索引
4. **限流与防爆破**：登录、2FA、兑换、重置密码全部加限流
5. **审计日志**：所有管理操作可追溯

## P1（两周内）
6. **风控规则引擎**：异常 IP、异常国家、短时高频请求
7. **配置中心**：把安全阈值（锁定次数、过期时间）改成后台可配
8. **可观测性**：结构化日志 + 错误告警（Sentry/告警机器人）

## P2（规模化）
9. **异步任务队列**：批量卡密生成、导出走队列
10. **WAF/CDN 防护**：在边缘拦截恶意流量
11. **定期安全测试**：依赖漏洞扫描 + 渗透测试

---

## 5. RPC 放前端时的明确边界

### 可以放前端
- 区块链只读查询（余额、名称解析、合约 view）

### 绝不能放前端
- 私钥/签名私密逻辑
- 管理员鉴权逻辑
- 卡密核销与权限判定

> 也就是：RPC 在前端可以，但安全决策必须后端做。

---

## 6. Vercel 环境变量（最终清单）

### 前端
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_ALLOWED_DOMAINS`
- `NEXT_PUBLIC_FALLBACK_URL`

### 后端
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `TOTP_ENCRYPTION_KEY`
- `ADMIN_FORCE_2FA=true`
- `DOMAIN_RESTRICTION_ENABLED=true`
- `ALLOWED_DOMAINS`
- `DOMAIN_FALLBACK_URL`

---

## 7. 上线执行顺序（实操）

1. 先完成后端登录链路（账号密码 + 2FA）
2. 再上线域名策略页（白名单/跳转/开关）
3. 接入模块级域名校验中间件
4. 完成卡密模块事务化与幂等保护
5. 灰度发布并验证：
   - 非白名单页面会跳转
   - 非白名单 API 返回 403
   - 登录失败锁定生效
   - 发布后用户与卡密数据不丢失

---

## 8. 一句话最终版

你现在可以按“前后端分开”落地：
- 前端放 RPC 和页面跳转；
- 后端做登录（账号密码+2FA）、卡密、权限、域名强校验；
- 并通过白名单/跳转/开关三件套，保证后台域名访问安全。
