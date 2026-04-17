-- ENS Manager Database Schema (Supabase Auth Version)
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROFILES TABLE (User Extension) ====================
-- This table extends auth.users with additional fields
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- user, admin, super_admin
  card_key VARCHAR(64) UNIQUE,
  group_id UUID,
  status BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  query_count INTEGER DEFAULT 0,
  last_query_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_card_key ON profiles(card_key);

-- ==================== AUTO CREATE PROFILE ON USER SIGNUP ====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== USER GROUPS TABLE ====================
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_groups_name ON user_groups(name);

-- ==================== CARD GROUPS TABLE ====================
CREATE TABLE IF NOT EXISTS card_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_groups_name ON card_groups(name);

-- ==================== CARD RULES TABLE ====================
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

-- ==================== CARD KEYS TABLE ====================
CREATE TABLE IF NOT EXISTS card_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key VARCHAR(64) UNIQUE NOT NULL,
  rule_id UUID REFERENCES card_rules(id) ON DELETE SET NULL,
  group_id UUID REFERENCES card_groups(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired, frozen
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

-- ==================== RPC GROUPS TABLE ====================
CREATE TABLE IF NOT EXISTS rpc_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rpc_groups_name ON rpc_groups(name);

-- ==================== RPC NODES TABLE ====================
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

-- ==================== SITE CONFIG TABLE ====================
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

-- ==================== SYSTEM SETTINGS TABLE (For Admin Configuration) ====================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, json, array
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Whether this setting can be read by frontend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);

COMMENT ON TABLE system_settings IS 'System settings configurable by super admin';

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('default_rpc_url', 'https://eth.llamarpc.com', 'text', 'Default RPC node URL', true),
  ('allowed_domains', 'opendogo.vercel.app,yourdomain.com', 'array', 'Allowed domains (comma separated)', true),
  ('unauthorized_redirect_url', 'https://example.com/unauthorized', 'text', 'Redirect URL for unauthorized access', false),
  ('site_name', 'ENS Manager', 'text', 'Website name', true),
  ('site_description', 'ENS Domain Batch Query Platform', 'text', 'Website description', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ==================== ANNOUNCEMENTS TABLE ====================
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

-- ==================== OPERATION LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

-- ==================== API LOGS TABLE ====================
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

-- ==================== ERROR LOGS TABLE ====================
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

-- ==================== DOMAIN AUTHORIZATIONS TABLE ====================
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

-- ==================== INSERT DEFAULT DATA ====================

-- Insert default site config
INSERT INTO site_config (config_key, site_name, site_description, features) 
VALUES ('default', 'ENS Manager', 'ENS Domain Batch Query Platform', '{"query": true, "user_system": true, "card_system": true}')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default system config
INSERT INTO system_config (config_key, rate_limit_config, security_config) 
VALUES ('default', 
  '{"global": 1000, "per_ip": 100, "per_user": 60}',
  '{"enable_2fa": false, "enable_ip_whitelist": false}'
)
ON CONFLICT (config_key) DO NOTHING;

-- Insert default user group
INSERT INTO user_groups (name, description, permissions)
VALUES ('default', 'Default user group', '{"query": true}')
ON CONFLICT DO NOTHING;

-- Insert default RPC group
INSERT INTO rpc_groups (name, description)
VALUES ('default', 'Default RPC group')
ON CONFLICT DO NOTHING;

-- Insert default RPC node
INSERT INTO rpc_nodes (name, url, group_id, priority, status, health_status)
VALUES ('Ethereum Mainnet', 'https://eth.llamarpc.com', (SELECT id FROM rpc_groups WHERE name = 'default'), 1, true, 'healthy')
ON CONFLICT DO NOTHING;

-- ==================== CARD MANAGER ROLE TABLE ====================
-- Separate table for card managers with limited permissions
CREATE TABLE IF NOT EXISTS card_managers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(100) UNIQUE NOT NULL,
  status BOOLEAN DEFAULT true,
  allowed_actions JSONB DEFAULT '{"generate": true, "view": false, "edit": false, "delete": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_managers_email ON card_managers(email);
CREATE INDEX idx_card_managers_status ON card_managers(status);

COMMENT ON TABLE card_managers IS 'Card managers with limited permissions (generate only)';

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Enable RLS on card_managers table
ALTER TABLE card_managers ENABLE ROW LEVEL SECURITY;

-- Policy: Card managers can view their own record
CREATE POLICY "Card managers can view own record"
ON card_managers FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can manage all card managers
CREATE POLICY "Admins can manage card managers"
ON card_managers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Enable RLS on card_keys table
ALTER TABLE card_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Card managers can insert (generate) cards
CREATE POLICY "Card managers can generate cards"
ON card_keys FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM card_managers 
    WHERE id = auth.uid() AND status = true 
    AND (allowed_actions->>'generate')::boolean = true
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Card managers can view cards (if allowed)
CREATE POLICY "Card managers can view cards"
ON card_keys FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM card_managers 
    WHERE id = auth.uid() AND status = true 
    AND (allowed_actions->>'view')::boolean = true
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ==================== FUNCTIONS AND TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_keys_updated_at BEFORE UPDATE ON card_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rpc_nodes_updated_at BEFORE UPDATE ON rpc_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_authorizations_updated_at BEFORE UPDATE ON domain_authorizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE card_keys IS 'Access card keys';
COMMENT ON TABLE rpc_nodes IS 'RPC endpoint nodes';
COMMENT ON TABLE operation_logs IS 'User operation audit logs';
COMMENT ON TABLE api_logs IS 'API request logs';
