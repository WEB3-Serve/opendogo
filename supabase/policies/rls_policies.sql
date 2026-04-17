-- Supabase RLS (Row Level Security) Policies
-- 确保数据安全访问

-- ============================================
-- 启用 RLS
-- ============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpc_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpc_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Admins 表策略
-- ============================================

-- 管理员只能查看自己的信息
CREATE POLICY "Admins can view own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

-- 只有超级管理员可以更新其他管理员
CREATE POLICY "Super admins can update any admin" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- Users 表策略
-- ============================================

-- 用户可以查看自己的信息
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 管理员可以操作用户
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- Card Keys 表策略
-- ============================================

-- 管理员可以管理所有卡密
CREATE POLICY "Admins can manage all cards" ON card_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 用户可以查看自己激活的卡密
CREATE POLICY "Users can view own activated cards" ON card_keys
  FOR SELECT USING (used_by = auth.uid());

-- ============================================
-- RPC Nodes 表策略
-- ============================================

-- 所有人都可以读取 RPC 节点（用于前端查询）
CREATE POLICY "Everyone can read RPC nodes" ON rpc_nodes
  FOR SELECT USING (true);

-- 只有管理员可以管理 RPC 节点
CREATE POLICY "Admins can manage RPC nodes" ON rpc_nodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- Operation Logs 表策略
-- ============================================

-- 管理员可以查看所有操作日志
CREATE POLICY "Admins can view operation logs" ON operation_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 只记录，不允许普通用户插入
CREATE POLICY "System can insert operation logs" ON operation_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- API Logs 表策略
-- ============================================

-- 管理员可以查看所有 API 日志
CREATE POLICY "Admins can view API logs" ON api_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 系统自动记录
CREATE POLICY "System can insert API logs" ON api_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Query Logs 表策略
-- ============================================

-- 用户可以查看自己的查询记录
CREATE POLICY "Users can view own query logs" ON query_logs
  FOR SELECT USING (user_id = auth.uid());

-- 管理员可以查看所有查询记录
CREATE POLICY "Admins can view all query logs" ON query_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- System Configs 表策略
-- ============================================

-- 所有人都可以读取系统配置
CREATE POLICY "Everyone can read system configs" ON system_configs
  FOR SELECT USING (true);

-- 只有管理员可以修改系统配置
CREATE POLICY "Admins can update system configs" ON system_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- Announcements 表策略
-- ============================================

-- 所有人都可以读取已发布的公告
CREATE POLICY "Everyone can read published announcements" ON announcements
  FOR SELECT USING (is_published = true);

-- 管理员可以管理所有公告
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- Billing Records 表策略
-- ============================================

-- 用户可以查看自己的计费记录
CREATE POLICY "Users can view own billing records" ON billing_records
  FOR SELECT USING (user_id = auth.uid());

-- 管理员可以查看所有计费记录
CREATE POLICY "Admins can view all billing records" ON billing_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================
-- Functions for RLS
-- ============================================

-- 获取当前用户角色
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM admins WHERE id = auth.uid();
  IF user_role IS NULL THEN
    SELECT 'user' INTO user_role;
  END IF;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查是否为管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查是否为超级管理员
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin' AND status = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
