# ⚡ 3 分钟快速部署

## 第一步：Supabase 初始化 (1 分钟)

1. 访问 https://supabase.com 创建项目
2. 进入 **SQL Editor**
3. 复制 `supabase/init-db.sql` 全部内容执行

✅ 数据库就绪！

---

## 第二步：Vercel 环境变量 (1 分钟)

在 Vercel 项目设置中添加：

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
```

获取密钥位置：Supabase → Settings → API

---

## 第三步：部署 (1 分钟)

```bash
vercel --prod
```

完成！🎉

---

## 防盗说明

ens.html 已启用：
- ❌ 禁用右键/F12/Ctrl+S/Ctrl+U
- ❌ 禁止文本选择
- ⚠️ DevTools 检测

核心逻辑在服务器端，下载也无法运行！
