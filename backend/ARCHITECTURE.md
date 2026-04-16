# OpenDogo 后台联调可用版（Node.js）

## 本次优化
- Prisma 初始化：增加 `setup` 脚本与 `prisma/seed.js`，可一键生成客户端、推送 schema、初始化数据。
- 登录风控：登录失败次数锁定（用户名+IP），15 分钟窗口内连续失败达到阈值后临时锁定。
- 权限细粒度：RBAC 从“角色校验”升级到“权限点校验”（例如 `cards:activate`、`rpc:manage`）。
- 前端联调：新增 `public/login.html` 与 `public/dashboard.html`，可直接调用 API 联调。
- 后台登录改为环境变量：
  - `ADMIN_ACCOUNT`
  - `ADMIN_PASSWORD`
  - `ADMIN_2FA`

## 启动
1. `cd backend`
2. `cp .env.example .env`
3. 设置 `ADMIN_ACCOUNT / ADMIN_PASSWORD / ADMIN_2FA`（`ADMIN_2FA` 是 Base32 密钥，不是6位验证码）
4. `npm install`
5. `npm run setup`
6. `npm run dev`

## 登录流程（2FA）
1. 前端点击登录，调用 `POST /api/admin/auth/prelogin` 校验账号密码。
2. 账号密码正确后，弹出输入框输入谷歌验证码。
3. 前端调用 `POST /api/admin/auth/login` 提交 `preAuthToken + code`。
4. 后端按 `ADMIN_2FA`（Google Authenticator Base32 密钥）计算**时间型 TOTP**并验证。
5. 验证成功返回 JWT。

## 关键接口（已按权限拆分）
- `POST /api/admin/auth/prelogin`
- `POST /api/admin/auth/login`
- `GET /api/admin/dashboard/summary`
- `GET /api/admin/users`
- `GET /api/admin/users/groups`
- `GET /api/admin/users/activations`
- `GET /api/admin/cards`
- `POST /api/admin/cards/activate` (`cards:activate`)
- `GET /api/admin/rpc/nodes`
- `POST /api/admin/rpc/nodes` (`rpc:manage`)
- `POST /api/admin/rpc/health-check` (`rpc:manage`)

## 前端联调页面
- `/login.html`：两段式登录（账号密码 -> 谷歌验证码）
- `/dashboard.html`：并行拉取 summary/users/cards/rpc 并展示 JSON
