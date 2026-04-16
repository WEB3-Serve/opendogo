# OpenDogo 完整版（Vercel 自动部署 + Admin API + Supabase 邮箱验证 + 免费数据库）

你当前前端入口：`https://opendogo.vercel.app/ens.html`（保留，不做首页）。

本次已完成：
- 保留根目录静态页面 `ens.html` 作为前台入口。
- 新增后台管理前端：`/admin/login.html`、`/admin/dashboard.html`。
- 新增 Vercel Serverless API：`/api/admin/*`（直接复用 `backend` 里的 Express 路由）。
- 后端改为可独立运行，同时支持 Vercel 无服务器模式。
- 数据库改为 **PostgreSQL**，可直接对接 Supabase/Neon 免费版。
- 后台登录支持 **Supabase 邮箱验证**：邮箱未验证无法通过预登录。

---

## 一、系统架构（完整版）

```text
Browser
  ├─ https://opendogo.vercel.app/ens.html          (前台静态页)
  ├─ https://opendogo.vercel.app/admin/login.html  (后台登录页)
  └─ https://opendogo.vercel.app/admin/dashboard.html
                    │
                    ▼
Vercel Static Hosting + Serverless Functions
  └─ /api/admin/*  -> api/admin/[...path].js -> backend/src/app.js
                    │
                    ▼
Supabase / Neon PostgreSQL (Free Tier)
  └─ DATABASE_URL 由 Vercel Environment Variables 提供
```

---

## 二、目录说明

- `ens.html`：前台页面（你当前线上地址）。
- `admin/`：后台静态前端（登录 + 仪表盘）。
- `api/admin/[...path].js`：Vercel API 入口，转发给 Express app。
- `backend/src/app.js`：Express 应用（中间件 + 路由）。
- `backend/src/main.js`：本地/服务器模式启动入口（含定时任务）。
- `backend/prisma/schema.prisma`：数据库模型（PostgreSQL）。
- `backend/.env.example`：后端环境变量模板（包含登录信息字段）。

---

## 三、Vercel 自动部署配置（你只要按这个填）

### 1) 导入 GitHub 仓库
- 在 Vercel 里 `Add New Project`，选择你的 GitHub 仓库。
- Framework Preset 选 `Other`。
- Root Directory 留空（仓库根目录）。

### 2) Environment Variables（必须）
在 Vercel 项目中添加：

- `DATABASE_URL`：Neon 提供的连接串（带 `sslmode=require`）
- `JWT_SECRET`：任意高强度随机字符串
- `SUPABASE_URL`：Supabase 项目地址（开启 Supabase 邮箱验证登录时必填）
- `SUPABASE_ANON_KEY`：Supabase 匿名 key（开启 Supabase 邮箱验证登录时必填）
- `ADMIN_ACCOUNT`：后台账号，例如 `admin`
- `ADMIN_PASSWORD`：后台密码（自己设置）
- `ADMIN_2FA`：Google Authenticator Base32 密钥
- `CORS_ORIGIN`：建议 `*`（同域时可用），或填你的域名

> 注意：Vercel 上修改环境变量后，需重新 Deploy。

### 3) 数据库初始化
本项目 Prisma 模型在 `backend/prisma/schema.prisma`。

你可在本地执行一次：

```bash
cd backend
npm install
npx prisma db push
npm run seed
```

把同一套 `DATABASE_URL` 用在 Vercel，即可直接读写。

---

## 四、免费数据库（Supabase / Neon）对接步骤

### 方案 A：Supabase（推荐，含邮箱验证 Auth）
1. 打开 Supabase 注册免费账号并创建项目。
2. 在 **Authentication** 开启 Email provider，并保持邮箱验证开启。
3. 在 **Project Settings -> API** 复制：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. 在 **Project Settings -> Database** 复制 Postgres 连接串到 `DATABASE_URL`。
5. 本地执行 `prisma db push` 初始化表结构。

### 方案 B：Neon（纯数据库）
1. 打开 Neon 注册免费账号并新建数据库。
2. 复制 `postgresql://...sslmode=require` 到 `DATABASE_URL`。
3. 本地执行 `prisma db push` 初始化表结构。

---

## 五、后台登录信息与 2FA

### 后端登录地址（你要的）

- 管理后台登录页：`https://opendogo.vercel.app/admin/login.html`
- 后端预登录接口：`POST https://opendogo.vercel.app/api/admin/auth/prelogin`
- 后端登录接口：`POST https://opendogo.vercel.app/api/admin/auth/login`

### 登录接口流程
1. `POST /api/admin/auth/prelogin` 提交账号密码。
2. 若配置了 Supabase，则会校验邮箱是否已验证（`email_confirmed_at`）。
3. 成功后返回 `preAuthToken`。
4. `POST /api/admin/auth/login` 提交 `preAuthToken + code`（2FA验证码）。
5. 返回 JWT token。

### 你需要准备的登录信息
- Supabase 模式（推荐）：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - 一个已完成邮箱验证的 Supabase 用户邮箱和密码
  - `ADMIN_2FA`（Google Authenticator 密钥）
- 传统模式（未配置 Supabase 时回退）：
  - `ADMIN_ACCOUNT`
  - `ADMIN_PASSWORD`
  - `ADMIN_2FA`

### 生成新的 2FA 密钥

```bash
cd backend
npm run gen:2fa
```

命令会输出：
- `ADMIN_2FA=...`
- `otpauth://...`（可用于二维码生成并导入 Google Authenticator）

---

## 六、访问地址

- 前台：`https://opendogo.vercel.app/ens.html`
- 后台登录：`https://opendogo.vercel.app/admin/login.html`
- 后台面板：`https://opendogo.vercel.app/admin/dashboard.html`
- 健康检查：`https://opendogo.vercel.app/api/admin/auth/prelogin`（登录接口可直接验证函数是否在线）

---

## 七、本地运行（开发）

### 后端
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run dev
```

后端默认 `http://localhost:3000`。

### 前端（静态）
仓库根目录直接起静态服务即可（例如 Python）：

```bash
python3 -m http.server 5173
```

访问：
- `http://localhost:5173/ens.html`
- `http://localhost:5173/admin/login.html`

---

## 八、重要说明

- 你当前“不做 index 首页”的要求已满足；系统不依赖 `index.html`。
- 后台页默认 API 指向同域（Vercel 一体化部署可直接通）。
- 如后端改为独立域名，可在登录页里保存自定义 API 地址。
