# backend（生产版集成骨架）

已集成你要求的核心能力：
- PostgreSQL 持久化（用户/卡密/域名规则/审计日志）
- Redis（登录失败锁定、可扩展限流）
- 后台登录：账号密码 + 真实 TOTP（Google Authenticator）
- 域名白名单 + 跳转域名 + 开关
- 用户、卡密、域名规则、审计日志 API（管理员）

## 1. 后端登录地址 / 账号密码
- 本地登录地址：`http://localhost:3001/admin/login`
- 生产登录地址（示例）：`https://admin.opendogo.com/login`
- 默认账号：`ADMIN_ACCOUNT`（未配置时为 `admin`）
- 默认密码：`ADMIN_PASSWORD`（未配置时为 `changeme`）
- 建议生产使用 `ADMIN_PASSWORD_HASH`，不要明文密码。

## 2. 启动步骤
```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run start
```

## 3. 数据不丢失说明
- 数据存 PostgreSQL（不是本地文件）
- 部署只更新代码，数据库保留
- 使用 Prisma migration 管理结构更新
- 卡密核销使用事务，避免重复核销

## 4. 主要接口

### 认证
- `POST /api/admin/auth/login-password`
- `POST /api/admin/auth/login-2fa`
- `POST /api/admin/auth/refresh`
- `POST /api/admin/auth/logout`

### 管理员（需 Bearer token）
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`
- `GET /api/admin/user-records/:account`（查看某用户记录）
- `PATCH /api/admin/users/:id/status`（更新用户状态）
- `GET /api/admin/domain-rules`
- `POST /api/admin/domain-rules`
- `GET /api/admin/license-batches`
- `POST /api/admin/license-batches`
- `POST /api/admin/license-redeem`

### 其他
- `GET /health`
- `GET /admin/login`（返回后台管理页面 `admin.html`）

### 前端用户（ENS 页面）
- `POST /api/client/register`（注册）
- `POST /api/client/login`（登录）
- `GET /api/client/profile`（读取当前用户信息，需 Bearer token）
- `POST /api/client/redeem`（卡密激活，需 Bearer token）
- `GET /api/client/query-limit`（读取当前角色可查询数量）

## 5. 首次管理员账号
启动时会自动创建管理员（若不存在）：
- 账号：`ADMIN_ACCOUNT`
- 密码：`ADMIN_PASSWORD` 或 `ADMIN_PASSWORD_HASH`
- 2FA Secret：`ADMIN_TOTP_SECRET`（未配置会自动生成并打印）
- 2FA Secret 会加密后再入库。

### 5.1 如何绑定谷歌验证器（Google Authenticator）
1. 准备好管理员的 `ADMIN_TOTP_SECRET`（Base32 字符串，示例：`JBSWY3DPEHPK3PXP`）。
   - 如果你没有手动配置，首次启动后端时会在日志中打印生成值。
2. 打开 Google Authenticator（或 Microsoft Authenticator / 1Password 等 TOTP App）。
3. 选择“手动输入密钥（Enter a setup key）”：
   - 账号名：例如 `opendogo-admin`
   - 密钥：填 `ADMIN_TOTP_SECRET`
   - 类型：`基于时间（Time based）`
4. 保存后，App 会每 30 秒生成一个 6 位验证码。
5. 在后台登录页中：
   - 第一步先输入账号密码并点击“获取登录票据”
   - 第二步输入 App 里的 6 位验证码，再点击“登录后台”。

> 常见问题：如果提示 `TOTP_INVALID`，请先检查手机系统时间是否开启“自动同步”。

## 6. 前端后台管理页接口对接
已提供演示页（根目录）：
- `admin.html` + `admin.js` + `admin.css`

可直接测试多模块对接：
1. 登录（账号密码 -> 2FA）
2. 看板统计（`/api/admin/dashboard`）
3. 用户管理（列表 + 状态更新）
4. 域名规则（加载 + 保存）
5. 卡密批次（生成 + 加载）
6. 用户记录查询（`/api/admin/user-records/:account`）

## 7. 环境变量
详见 `.env.example`。

重点字段：
- `ALLOWED_DOMAINS`：限制请求的 Host（后端服务自身域名白名单）。
- `ALLOWED_ORIGINS`：限制浏览器发起请求的 Origin/Referer（前端来源白名单）。
- `GUEST_QUERY_LIMIT`：游客可查询上限（默认 200）。
- `REGISTERED_QUERY_LIMIT`：注册用户可查询上限（默认 500）。
- `VIP_QUERY_LIMIT`：VIP 可查询上限（`unlimited` 表示无限）。

> 如果别人下载你的前端后依然可以调用后端，通常是因为只校验了 Host，未校验 Origin，或 CORS 放开了 `*`。当前版本已同时加入 CORS 白名单和 Origin 校验。

## 8. 怎么加密保护后台登录账号密码（实操）

按下面 6 步做：

1. **不要在生产用明文 `ADMIN_PASSWORD`**  
   只在本地调试使用，生产改为 `ADMIN_PASSWORD_HASH`。

2. **生成密码哈希**
```bash
cd backend
npm run security:hash-password -- "你的强密码"
```
把输出值填到：
```env
ADMIN_PASSWORD_HASH=<上面输出的bcrypt哈希>
```

3. **生成后台敏感信息加密密钥**
```bash
npm run security:gen-admin-key
```
把输出值填到：
```env
ADMIN_SECRET_ENC_KEY=<32字节随机十六进制>
```

4. **2FA 强制开启**
```env
ADMIN_FORCE_2FA=true
```
并确保管理员已绑定 Google Authenticator。

5. **启用登录锁定策略（防爆破）**
```env
LOGIN_MAX_FAIL=5
LOGIN_LOCK_MINUTES=15
```

6. **最小化暴露与轮换**
- 仅通过环境变量注入密钥，不写入仓库；
- 定期轮换 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `ADMIN_SECRET_ENC_KEY`；
- 管理后台仅允许白名单域名访问。
