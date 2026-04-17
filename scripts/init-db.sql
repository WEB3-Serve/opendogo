-- ENS Manager Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Admin Table ====================
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

CREATE INDEX idx_admins_username ON admins(username);

-- ==================== User Groups Table ====================
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_groups_name ON user_groups(name);

-- ==================== Users Table ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  card_key VARCHAR(64) UNIQUE,
  group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL,
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  query_count INTEGER DEFAULT 0,
  last_query_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_card_key ON users(card_key);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_username ON users(username);

-- ==================== Card Groups Table ====================
CREATE TABLE IF NOT EXISTS card_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_groups_name ON card_groups(name);

-- ==================== Card Rules Table ====================
CREATE TABLE IF NOT EXISTS card_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  valid_days INTEGER DEFAULT 30,
  max_queries_per_day INTEGER DEFAULT 100,
  allow_batch BOOLEAN DEFAULT true,
  max_batch_size INTEGER DEFAULT 50,
  price DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_rules_name ON card_rules(name);

-- ==================== Card Keys Table ====================
CREATE TABLE IF NOT EXISTS card_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key VARCHAR(64) UNIQUE NOT NULL,
  rule_id UUID REFERENCES card_rules(id) ON DELETE SET NULL,
  group_id UUID REFERENCES card_groups(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired, frozen
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  batch_id VARCHAR(64),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_keys_card_key ON card_keys(card_key);
CREATE INDEX idx_card_keys_status ON card_keys(status);
CREATE INDEX idx_card_keys_rule_id ON card_keys(rule_id);
CREATE INDEX idx_card_keys_group_id ON card_keys(group_id);
CREATE INDEX idx_card_keys_batch_id ON card_keys(batch_id);

-- ==================== RPC Groups Table ====================
CREATE TABLE IF NOT EXISTS rpc_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rpc_groups_name ON rpc_groups(name);

-- ==================== RPC Nodes Table ====================
CREATE TABLE IF NOT EXISTS rpc_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  group_id UUID REFERENCES rpc_groups(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 1,
  status BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, unhealthy, unknown
  avg_response_time INTEGER,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rpc_nodes_status ON rpc_nodes(status);
CREATE INDEX idx_rpc_nodes_health ON rpc_nodes(health_status);
CREATE INDEX idx_rpc_nodes_group_id ON rpc_nodes(group_id);

-- ==================== Site Config Table ====================
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE DEFAULT 'default',
  site_name VARCHAR(100),
  site_description TEXT,
  site_keywords TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  theme VARCHAR(20) DEFAULT 'light',
  features JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  seo_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== System Config Table ====================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE DEFAULT 'default',
  rate_limit_config JSONB DEFAULT '{}',
  security_config JSONB DEFAULT '{}',
  api_config JSONB DEFAULT '{}',
  notification_config JSONB DEFAULT '{}',
  backup_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Announcements Table ====================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- info, warning, success, error
  published BOOLEAN DEFAULT false,
  publish_at TIMESTAMP WITH TIME ZONE,
  expire_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements(published);
CREATE INDEX idx_announcements_publish_at ON announcements(publish_at);

-- ==================== Operation Logs Table ====================
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

-- ==================== API Logs Table ====================
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
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);

-- ==================== Error Logs Table ====================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(50),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint VARCHAR(100),
  user_id UUID,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);

-- ==================== Insert Default Data ====================

-- Insert default site config
INSERT INTO site_config (config_key, site_name, site_description, features) 
VALUES ('default', 'ENS Manager', 'ENS Domain Batch Query Platform', '{"query": true, "user_system": true, "card_system": true}')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default system config
INSERT INTO system_config (config_key, rate_limit_config, security_config) 
VALUES ('default', 
  '{"global": 1000, "per_ip": 100, "per_user": 60}',
  '{"enable_2fa": true, "enable_ip_whitelist": false}'
)
ON CONFLICT (config_key) DO NOTHING;

-- ==================== Domain Authorizations Table ====================
CREATE TABLE IF NOT EXISTS domain_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_domain_authorizations_domain ON domain_authorizations(domain);
CREATE INDEX idx_domain_authorizations_active ON domain_authorizations(is_active);

COMMENT ON TABLE domain_authorizations IS 'Authorized domains for system access';

-- Apply trigger to domain_authorizations table
CREATE TRIGGER update_domain_authorizations_updated_at BEFORE UPDATE ON domain_authorizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== Row Level Security (RLS) ====================
-- Note: For admin panel APIs, we typically disable RLS and handle auth in the API layer
-- Uncomment if you want to enable RLS

-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE card_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rpc_nodes ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
-- Example:
-- CREATE POLICY "Admins can view all data" ON users FOR SELECT USING (true);

-- ==================== Functions and Triggers ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_keys_updated_at BEFORE UPDATE ON card_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpc_nodes_updated_at BEFORE UPDATE ON rpc_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE admins IS 'Administrator accounts';
COMMENT ON TABLE users IS 'Platform users';
COMMENT ON TABLE card_keys IS 'Access card keys';
COMMENT ON TABLE rpc_nodes IS 'RPC endpoint nodes';
COMMENT ON TABLE operation_logs IS 'Admin operation audit logs';
COMMENT ON TABLE api_logs IS 'API request logs';
