# ENS Manager - 部署指南

## 📋 部署步骤 (3 步完成)

### 第一步：Supabase 数据库初始化

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目或选择现有项目
3. 进入 **SQL Editor** 页面
4. 复制并执行 `supabase/init-db.sql` 中的全部 SQL 代码
5. 执行完成后会创建 12 张表和默认数据

**默认管理员账号**:
- 用户名：`admin`
- 密码：`admin123`
- ⚠️ 首次登录后请立即修改密码！

---

### 第二步：Vercel 环境变量配置

1. 登录 [Vercel](https://vercel.com)
2. 导入你的 GitHub 仓库或拖拽上传项目
3. 进入项目设置 → **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SUPABASE_URL` | `https://yxulnfkndzjztqqtpgnm.supabase.co` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | `sb_publishable_W7yTR46_iifpnLDVQHyPtw_hiK5OPWN` | 匿名 Key (前端可用) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 服务角色 Key (仅后端) |
| `JWT_SECRET` | `ens_manager_super_secret_jwt_key_2024_change_in_production` | JWT 密钥 |

⚠️ **安全提示**: 
- `SUPABASE_SERVICE_ROLE_KEY` 具有完全数据库权限，绝对不能暴露在前端！
- `JWT_SECRET` 生产环境请修改为随机字符串

---

### 第三步：部署到 Vercel

```bash
# 安装 Vercel CLI (如未安装)
npm i -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

或者在 Vercel 官网直接连接 GitHub 仓库自动部署。

---

## 📁 项目结构

```
/workspace
├── index.html              # 首页
├── ens.html                # ENS 查询页 (已启用防盗保护)
├── admin/
│   └── index.html          # 管理后台
├── api/                    # Vercel Serverless API (7 个)
│   ├── auth.js            # 认证
│   ├── rpc.js             # ENS 查询 (核心逻辑)
│   ├── users.js           # 用户管理
│   ├── cards.js           # 卡密管理
│   ├── billing.js         # 计费系统
│   ├── admin.js           # 后台管理
│   └── logs.js            # 日志查询
├── lib/
│   └── supabase-client.js  # Supabase 客户端
├── supabase/
│   └── init-db.sql        # 数据库初始化脚本
├── .env.example           # 环境变量示例
└── DEPLOY.md              # 部署文档
```

---

## 🔐 安全机制

### 前端防盗 (ens.html)
- ❌ 禁用右键菜单
- ❌ 禁用 F12/Ctrl+Shift+I
- ❌ 禁用 Ctrl+S (保存页面)
- ❌ 禁用 Ctrl+U (查看源码)
- ❌ 禁止文本选择
- ⚠️ DevTools 检测 (自动清空页面)

### 后端安全
- ✅ 核心 ENS 查询逻辑在 `/api/rpc.js` 服务器端执行
- ✅ 前端只负责发请求和渲染结果
- ✅ RLS 行级安全策略保护数据库
- ✅ JWT Token 认证
- ✅ 操作日志记录

### 为什么下载也没用？
1. HTML 只是空壳，核心逻辑在服务器端 API
2. 需要 Supabase 数据库权限才能运行
3. 需要正确的环境变量配置
4. 即使下载所有文件也无法脱离服务器运行

---

## 🧪 测试

部署完成后访问：
- 首页：`https://your-domain.vercel.app`
- ENS 查询：`https://your-domain.vercel.app/ens.html`
- 管理后台：`https://your-domain.vercel.app/admin/`

使用默认管理员账号登录测试各项功能。

---

## 📝 注意事项

1. **RPC 节点**: 默认的公共 RPC 节点可能不稳定，建议替换为自己的节点
2. **密码修改**: 首次登录后立即修改管理员密码
3. **环境变量**: 生产环境务必修改 `JWT_SECRET`
4. **监控**: 定期检查 `operation_logs` 和 `query_logs` 表

---

## 🆘 常见问题

**Q: API 返回 500 错误？**
A: 检查 Vercel 环境变量是否正确配置，特别是 `SUPABASE_SERVICE_ROLE_KEY`

**Q: 无法登录？**
A: 确认 `supabase/init-db.sql` 已成功执行，管理员数据已插入

**Q: ENS 查询失败？**
A: 检查 RPC 节点是否可用，可在 `rpc_nodes` 表中更新节点 URL

---

## 📞 技术支持

如有问题请查看 Vercel 函数日志和 Supabase 数据库日志。
