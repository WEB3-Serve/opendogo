# OpenDoGo 完整系统架构说明

## 📁 项目结构

```
/workspace/
├── api/                      # Vercel Serverless API 后端
│   ├── lib/                  # 核心库文件
│   │   ├── supabase.js       # Supabase 数据库客户端配置
│   │   └── totp.js           # Google Authenticator (TOTP) 验证
│   ├── admin/                # 管理员接口
│   │   └── login.js          # 管理员登录（双因子验证）
│   ├── user/                 # 用户接口
│   │   ├── register.js       # 用户注册（Supabase 邮箱验证）
│   │   ├── login.js          # 用户登录
│   │   └── profile.js        # 用户信息获取
├── ens.html                  # 用户前端页面（登录/注册）
├── admin.html                # 管理员后台页面（双因子验证）
├── package.json              # 项目依赖配置
└── vercel.json               # Vercel 部署配置
```

## 🔗 访问地址

| 页面 | 地址 | 说明 |
|------|------|------|
| **用户首页** | `https://opendogo.vercel.app/ens.html` | 用户注册/登录 |
| **管理后台** | `https://opendogo.vercel.app/admin.html` | 管理员登录（需双因子验证） |

## 📡 API 接口列表

### 用户接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/user/register` | POST | 用户注册（自动发送邮箱验证） |
| `/api/user/login` | POST | 用户登录 |
| `/api/user/profile` | GET | 获取用户信息（需 Token） |

### 管理员接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/login` | POST | 管理员登录（两步验证） |

## 🔐 管理员登录流程

1. **第一步**：输入账号密码
   - 从环境变量读取：`ADMIN_ACCOUNT`、`ADMIN_PASSWORD`
   - 验证通过后返回 `step: '2fa_required'`

2. **第二步**：输入谷歌验证码
   - 从环境变量读取：`ADMIN_2FA_SECRET`
   - 使用 TOTP 算法验证 6 位动态码
   - 验证通过颁发管理员 Token

## 📧 用户注册流程

1. 用户填写邮箱和密码
2. 调用 Supabase Auth 注册
3. Supabase 自动发送验证邮件
4. 用户点击邮件链接验证邮箱
5. 验证后方可登录

## 🗄️ 数据库配置（Supabase）

### 免费套餐功能
- ✅ PostgreSQL 数据库（500MB）
- ✅ 用户认证系统
- ✅ 邮箱验证
- ✅ 自动 API 生成
- ✅ 实时订阅

### 获取 Supabase 配置
1. 访问 https://supabase.com
2. 创建新项目
3. 在 Settings → API 获取：
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_KEY`

### 启用邮箱验证
1. 进入 Supabase Dashboard
2. Authentication → Providers → Email
3. 开启 "Enable Email Signup"
4. 配置自定义 SMTP（可选，否则用 Supabase 默认）

## 🔑 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here

# 管理员账号
ADMIN_ACCOUNT=admin
ADMIN_PASSWORD=YourSecurePassword123

# Google Authenticator 密钥（32 字符 Base32）
ADMIN_2FA_SECRET=JBSWY3DPEHPK3PXP
```

### 生成 2FA 密钥

方法 1：使用在线工具
- 访问 https://totp.danhersam.com/
- 生成新密钥并保存到 Google Authenticator

方法 2：使用 Node.js
```javascript
const OTPAuth = require('otpauth');
const secret = new OTPAuth.Secret({ size: 20 });
console.log(secret.base32); // 保存此密钥
```

## 🚀 部署步骤

### 1. 准备 GitHub 仓库
```bash
cd /workspace
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/opendogo.git
git push -u origin main
```

### 2. Vercel 部署
1. 访问 https://vercel.com
2. Import GitHub Repository
3. 选择 `opendogo` 仓库
4. **重要**：添加环境变量（见上文）
5. 点击 Deploy

### 3. 配置自定义域名（可选）
1. Vercel Project Settings → Domains
2. 添加 `opendogo.vercel.app`（自动配置）
3. 或添加自定义域名

## 📱 Google Authenticator 配置

### 绑定步骤
1. 下载 Google Authenticator App
2. 打开 App，点击 "+"
3. 选择 "手动输入密钥"
4. 输入：
   - 账户名：`Admin`
   - 密钥：`ADMIN_2FA_SECRET` 的值
5. 保存后即可看到 6 位动态码

## 🧪 测试流程

### 测试用户注册
1. 访问 `https://opendogo.vercel.app/ens.html`
2. 切换到"注册"标签
3. 输入邮箱和密码
4. 收到提示"请检查邮箱验证"
5. 查收验证邮件并点击链接

### 测试管理员登录
1. 访问 `https://opendogo.vercel.app/admin.html`
2. 输入管理员账号密码
3. 点击登录
4. 出现谷歌验证码输入框
5. 打开 Google Authenticator 输入 6 位码
6. 成功进入后台

## ⚠️ 注意事项

1. **安全建议**
   - 生产环境使用强密码
   - 定期更换 `ADMIN_2FA_SECRET`
   - 不要将密钥提交到 Git

2. **Supabase 限制**
   - 免费版每月 50,000 MAU
   - 数据库 500MB
   - 适合初创项目

3. **Vercel 限制**
   - Serverless Function 超时 10 秒
   - 每月 100GB 带宽（免费版）

## 🛠️ 故障排查

### 常见问题

**Q: 收不到验证邮件？**
- 检查垃圾邮件箱
- Supabase 默认使用共享邮箱，可能延迟
- 配置自定义 SMTP 提高送达率

**Q: 管理员登录提示配置错误？**
- 检查 Vercel 环境变量是否正确
- 确保 `ADMIN_2FA_SECRET` 是有效的 Base32 字符串

**Q: API 返回 CORS 错误？**
- 检查 `vercel.json` 中的 headers 配置
- 确保前端请求使用正确的域名

## 📞 技术支持

如有问题，请检查：
1. Vercel Deployment Logs
2. Supabase Logs
3. 浏览器控制台错误信息

---

**系统版本**: v1.0.0  
**最后更新**: 2024  
**技术栈**: Vercel + Supabase + Google Authenticator
