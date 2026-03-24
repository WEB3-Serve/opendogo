# ENS 后台管理系统（React + Ant Design）

## 项目结构

```text
opendogo/
├─ admin.html                    # React + Ant Design 后台页面（CDN可直接运行）
├─ admin.css                     # 后台样式补充
├─ admin.js                      # 兼容文件（实际运行逻辑在 admin.html）
├─ backend/
│  ├─ prisma/schema.prisma       # MySQL 数据模型
│  └─ src/routes/admin.js        # 后台接口
└─ ADMIN_SYSTEM_GUIDE_ZH.md
```

## 左侧导航（含子菜单）

- 仪表盘
- 用户管理
  - 用户列表
  - 用户分组
  - 用户激活记录
- 卡密管理
  - 卡密列表
  - 卡密规则
  - 卡密分组
- 网站管理
  - 网站配置
  - ENS查询配置
  - 公告管理
- 系统设置
  - 基础设置
  - 安全设置
  - 接口设置

## 主要页面与组件

- `Layout + Sider + Menu`：后台框架布局
- `Table`：用户、卡密、公告列表
- `Form`：配置与规则编辑
- `Modal`：用户详情、批量生成卡密结果、公告发布
- `Statistic/Card`：仪表盘统计

## 后端能力

- 用户系统：列表、详情、分组、激活记录
- 卡密系统：多类型卡密（天/周/月/季/年/无限）、分组、事务防重激活
- 网站管理：网站配置、ENS配置、公告
- 系统设置：基础/安全/API 配置
- 配置存储：`system_configs` 版本化追加（`isActive + version`）
- 关键操作：`audit_logs` 可追踪

## 运行

1. 启动后端（确保 MySQL 可用）：

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

2. 访问：
- `http://localhost:3001/admin/login`
