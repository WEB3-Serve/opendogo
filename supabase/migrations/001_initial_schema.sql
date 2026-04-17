-- ENS Manager Database Schema
-- Supabase PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 核心表结构
-- ============================================

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin',
  status BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  card_key VARCHAR(64) UNIQUE,
  group_id UUID REFERENCES user_groups(id),
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  query_count INTEGER DEFAULT 0,
  balance DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户分组表
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  daily_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 卡密表
CREATE TABLE IF NOT EXISTS card_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key VARCHAR(64) UNIQUE NOT NULL,
  rule_id UUID REFERENCES card_rules(id),
  group_id UUID REFERENCES card_groups(id),
  status VARCHAR(20) DEFAULT 'active', -- active/used/expired/frozen
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 卡密规则表
CREATE TABLE IF NOT EXISTS card_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  valid_days INTEGER DEFAULT 30,
  max_queries_per_day INTEGER DEFAULT 100,
  allow_batch BOOLEAN DEFAULT true,
  max_batch_size INTEGER DEFAULT 50,
  price DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 卡密分组表
CREATE TABLE IF NOT EXISTS card_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC 节点表
CREATE TABLE IF NOT EXISTS rpc_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  group_id UUID REFERENCES rpc_groups(id),
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 1,
  status BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(20) DEFAULT 'unknown', -- healthy/unhealthy/degraded
  avg_response_time INTEGER,
  success_rate DECIMAL(5, 2) DEFAULT 100.00,
  total_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC 分组表
CREATE TABLE IF NOT EXISTS rpc_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  strategy VARCHAR(20) DEFAULT 'round_robin', -- round_robin/weighted/priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 接口日志表
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 查询记录表
CREATE TABLE IF NOT EXISTS query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  domains TEXT[],
  result_count INTEGER,
  rpc_node_id UUID REFERENCES rpc_nodes(id),
  response_time INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  cost DECIMAL(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- info/warning/success
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 计费记录表
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- charge/consume/refund
  amount DECIMAL(10, 4) NOT NULL,
  balance_before DECIMAL(10, 4),
  balance_after DECIMAL(10, 4),
  description TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引优化
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_card_key ON users(card_key);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_card_keys_status ON card_keys(status);
CREATE INDEX IF NOT EXISTS idx_card_keys_used_by ON card_keys(used_by);
CREATE INDEX IF NOT EXISTS idx_rpc_nodes_status ON rpc_nodes(status);
CREATE INDEX IF NOT EXISTS idx_rpc_nodes_health ON rpc_nodes(health_status);
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON billing_records(created_at);

-- ============================================
-- 触发器 - 自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpc_nodes_updated_at BEFORE UPDATE ON rpc_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始数据
-- ============================================

-- 默认管理员 (密码需要加密后插入，这里只是示例)
-- INSERT INTO admins (username, password_hash, role, status) 
-- VALUES ('admin', '$2b$10$...', 'super_admin', true);

-- 默认系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('site_config', '{"title": "ENS Manager", "description": "ENS 域名批量查询系统", "logo": "/logo.png"}', '网站基本配置'),
('rate_limit', '{"global": 1000, "per_ip": 100, "per_user": 50}', '限流配置'),
('rpc_settings', '{"timeout": 5000, "max_retries": 3}', 'RPC 节点设置')
ON CONFLICT (config_key) DO NOTHING;

-- 默认 RPC 分组
INSERT INTO rpc_groups (name, strategy, description) VALUES
('default', 'round_robin', '默认 RPC 节点组')
ON CONFLICT DO NOTHING;

-- 默认卡密规则
INSERT INTO card_rules (name, valid_days, max_queries_per_day, price, description) VALUES
('体验版', 7, 10, 0.00, '免费体验，7 天有效期'),
('标准版', 30, 100, 9.99, '标准套餐，30 天有效期'),
('专业版', 90, 500, 29.99, '专业套餐，90 天有效期'),
('企业版', 365, 2000, 99.99, '企业套餐，一年有效期')
ON CONFLICT DO NOTHING;
