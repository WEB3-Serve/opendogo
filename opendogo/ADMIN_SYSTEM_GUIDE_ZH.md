# ENS 后台管理系统对接指南（Vercel）

## 1. 已实现内容

- 后台页面：`admin.html`（React + Ant Design CDN）
- 登录接口：`/api/admin/login`
- 会话校验接口：`/api/admin/verify`
- 账号/密码/2FA：只在服务端读取 `ADMIN_ACCOUNT / ADMIN_PASSWORD / ADMIN_2FA`
- 会话返回：服务端使用 AES-256-GCM 加密 Token（不会返回明文账号密码）

## 2. 目录结构

```text
opendogo/
├─ admin.html
├─ admin.css
├─ admin.js
├─ api/
│  └─ admin/
│     ├─ login.js
│     └─ verify.js
└─ backend/
   ├─ prisma/schema.prisma
   └─ src/routes/admin.js
```

## 3. Vercel 环境变量

在 Vercel 项目 `Settings -> Environment Variables` 配置：

- `ADMIN_ACCOUNT`：后台账号
- `ADMIN_PASSWORD`：后台密码
- `ADMIN_2FA`：后台 2FA 验证码（当前实现为固定码校验）
- `ADMIN_AUTH_SECRET`：会话 Token 加密密钥（强烈建议 32 位以上随机字符串）
- `ADMIN_TOKEN_TTL_SECONDS`：可选，会话有效期秒数，默认 `7200`

## 4. 部署方式（GitHub 自动部署）

1. 把本地代码推送到 GitHub。
2. 在 Vercel 导入该仓库。
3. 如果你的项目根目录是 `opendogo`，在 Vercel 的 `Root Directory` 选择 `opendogo`。
4. 配置上面的环境变量并重新部署。

## 5. 前端调用说明

`admin.html` 中已经内置以下调用：

- 登录：`POST /api/admin/login`
- 校验：`GET /api/admin/verify`（Header 带 `Authorization: Bearer <token>`）

登录成功后，前端只保存后端返回的加密 Token，不会拿到环境变量明文。

## 6. 安全建议

- 生产环境务必使用强随机 `ADMIN_AUTH_SECRET`。
- 不要在前端打印或暴露 `ADMIN_*` 环境变量。
- 固定 2FA 仅适合过渡期，建议后续改成 TOTP（如 Google Authenticator）。
- 建议在后端增加登录失败次数限制和 IP 限流。
