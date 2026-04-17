-- ============================================
-- ENS Manager - Supabase Auth 最终版数据库脚本
-- ============================================

-- 1. 创建用户资料表 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 2. 创建卡密管理员表 (card_managers)
CREATE TABLE IF NOT EXISTS public.card_managers (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status BOOLEAN DEFAULT true,
  allowed_actions JSONB DEFAULT '{"generate": true, "view": false, "edit": false, "delete": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.card_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view card managers"
  ON public.card_managers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Card managers can view own status"
  ON public.card_managers FOR SELECT
  USING (auth.uid() = id);

-- 3. 创建卡分组表 (card_groups)
CREATE TABLE IF NOT EXISTS public.card_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.card_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view groups"
  ON public.card_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert groups"
  ON public.card_groups FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR
    EXISTS (SELECT 1 FROM public.card_managers WHERE id = auth.uid() AND status = true)
  );

-- 4. 创建卡规则表 (card_rules)
CREATE TABLE IF NOT EXISTS public.card_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_id UUID REFERENCES public.card_groups(id),
  rpc_limit INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 3600,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.card_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view rules"
  ON public.card_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert rules"
  ON public.card_rules FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR
    EXISTS (SELECT 1 FROM public.card_managers WHERE id = auth.uid() AND status = true)
  );

-- 5. 创建卡密钥表 (card_keys)
CREATE TABLE IF NOT EXISTS public.card_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  rule_id UUID REFERENCES public.card_rules(id),
  group_id UUID REFERENCES public.card_groups(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.card_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view all cards"
  ON public.card_keys FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR
    EXISTS (SELECT 1 FROM public.card_managers WHERE id = auth.uid() AND status = true)
  );

CREATE POLICY "Users can view own used cards"
  ON public.card_keys FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and managers can insert cards"
  ON public.card_keys FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR
    EXISTS (SELECT 1 FROM public.card_managers WHERE id = auth.uid() AND status = true)
  );

CREATE POLICY "Admins can update cards"
  ON public.card_keys FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can delete cards"
  ON public.card_keys FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 6. 创建 RPC 节点表 (rpc_nodes)
CREATE TABLE IF NOT EXISTS public.rpc_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  last_checked_at TIMESTAMPTZ,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rpc_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active RPC nodes"
  ON public.rpc_nodes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage RPC nodes"
  ON public.rpc_nodes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 7. 创建系统配置表 (system_settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can update settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 插入默认配置
INSERT INTO public.system_settings (key, value, description) VALUES
  ('DEFAULT_RPC_URL', 'https://eth.llamarpc.com', '默认 RPC 节点'),
  ('ALLOWED_DOMAINS', 'localhost,127.0.0.1', '允许的域名（逗号分隔）'),
  ('UNAUTHORIZED_REDIRECT_URL', '/unauthorized', '未授权跳转 URL')
ON CONFLICT (key) DO NOTHING;

-- 8. 创建操作日志表 (operation_logs)
CREATE TABLE IF NOT EXISTS public.operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON public.operation_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can view own logs"
  ON public.operation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs"
  ON public.operation_logs FOR INSERT
  WITH CHECK (true);

-- 9. 创建自动触发器：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_card_managers_email ON public.card_managers(email);
CREATE INDEX IF NOT EXISTS idx_card_keys_code ON public.card_keys(code);
CREATE INDEX IF NOT EXISTS idx_card_keys_expires ON public.card_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON public.operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON public.operation_logs(action);

-- ============================================
-- 初始化完成！
-- ============================================
