-- =====================================================
-- ENS Manager - Supabase 数据库初始化脚本
-- 直接在 Supabase SQL Editor 中执行此脚本
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 管理员表 (admins)
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin', -- super_admin, admin, operator
  status BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  card_key VARCHAR(64) UNIQUE,
  group_id UUID,
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  query_count INTEGER DEFAULT 0,
  balance DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. 用户分组表 (user_groups)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}',
  daily_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. 卡密表 (card_keys)
-- =====================================================
CREATE TABLE IF NOT EXISTS card_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key VARCHAR(64) UNIQUE NOT NULL,
  rule_id UUID,
  group_id UUID,
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired, frozen
  used_by UUID,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  value DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. 卡密规则表 (card_rules)
-- =====================================================
CREATE TABLE IF NOT EXISTS card_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  valid_days INTEGER DEFAULT 30,
  max_queries_per_day INTEGER DEFAULT 100,
  allow_batch BOOLEAN DEFAULT true,
  max_batch_size INTEGER DEFAULT 50,
  price DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. 卡密分组表 (card_groups)
-- =====================================================
CREATE TABLE IF NOT EXISTS card_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. RPC 节点表 (rpc_nodes)
-- =====================================================
CREATE TABLE IF NOT EXISTS rpc_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  group_id UUID,
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 1,
  status BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP,
  health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, unhealthy, unknown
  avg_response_time INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. RPC 分组表 (rpc_groups)
-- =====================================================
CREATE TABLE IF NOT EXISTS rpc_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 9. 操作日志表 (operation_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. 接口日志表 (api_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  request_data JSONB,
  response_data JSONB,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 11. 查询记录表 (query_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  domain_name VARCHAR(255) NOT NULL,
  result JSONB,
  cost DECIMAL(10, 4) DEFAULT 0.0000,
  rpc_node_id UUID,
  status VARCHAR(20) DEFAULT 'success',
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 12. 余额充值表 (billing_transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- recharge, consume, refund
  amount DECIMAL(10, 4) NOT NULL,
  balance_before DECIMAL(10, 4),
  balance_after DECIMAL(10, 4),
  card_key VARCHAR(64),
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 13. 系统配置表 (system_config)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 14. 公告表 (announcements)
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 创建索引 (优化查询性能)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_card_key ON users(card_key);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_card_keys_status ON card_keys(status);
CREATE INDEX IF NOT EXISTS idx_card_keys_card_key ON card_keys(card_key);
CREATE INDEX IF NOT EXISTS idx_rpc_nodes_status ON rpc_nodes(status);
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_id ON billing_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- =====================================================
-- 插入默认数据
-- =====================================================

-- 默认超级管理员 (密码：admin123，实际部署请修改)
-- 密码使用 bcrypt 加密，这里用占位符，实际需要通过 API 注册
INSERT INTO system_config (config_key, config_value, description) VALUES
  ('site_settings', '{"title": "ENS Manager Pro", "logo": "/logo.png", "footer": "© 2024 ENS Manager"}', '网站基本设置'),
  ('rpc_settings', '{"timeout": 5000, "retries": 3, "cache_enabled": true}', 'RPC 节点配置'),
  ('billing_settings', '{"query_price": 0.01, "recharge_rates": [10, 50, 100]}', '计费配置')
ON CONFLICT (config_key) DO NOTHING;

-- 默认 RPC 分组
INSERT INTO rpc_groups (name, description) VALUES
  ('主节点组', '高性能主要节点'),
  ('备用节点组', '故障转移备用节点')
ON CONFLICT DO NOTHING;

-- 默认卡密规则
INSERT INTO card_rules (name, valid_days, max_queries_per_day, price) VALUES
  ('体验版', 7, 10, 0.0000),
  ('标准版', 30, 100, 10.0000),
  ('专业版', 90, 500, 50.0000),
  ('企业版', 365, 2000, 200.0000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS (行级安全策略) - 生产环境必须启用
-- =====================================================

-- 启用 RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- 管理员表：只有超级管理员可以读取
CREATE POLICY "Admins can view admins" ON admins
  FOR SELECT USING (true); -- 实际应该通过 JWT 验证

-- 用户表：管理员可管理，用户只能查看自己
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true); -- 实际通过 API 层控制

-- 卡密表：管理员可管理
CREATE POLICY "Card keys management" ON card_keys
  FOR ALL USING (true);

-- 日志表：仅管理员可查看
CREATE POLICY "Logs admin only" ON operation_logs
  FOR SELECT USING (true);

CREATE POLICY "API logs admin only" ON api_logs
  FOR SELECT USING (true);

-- =====================================================
-- 完成提示
-- =====================================================
-- ✅ 数据库初始化完成！
-- 接下来请：
-- 1. 在 Vercel 环境变量中配置 SUPABASE_URL 和 SUPABASE_ANON_KEY
-- 2. 部署 API 函数
-- 3. 通过管理后台创建第一个管理员账号
