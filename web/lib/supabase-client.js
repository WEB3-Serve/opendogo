/**
 * Supabase Client - 前端 SDK 封装
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// 创建单例客户端
let supabaseInstance = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
}

// 快捷方法封装
export const supabase = {
  // 认证相关
  auth: {
    signIn: async (username, password) => {
      const client = getSupabaseClient();
      return await client.auth.signInWithPassword({ email: username, password });
    },
    signUp: async (email, password) => {
      const client = getSupabaseClient();
      return await client.auth.signUp({ email, password });
    },
    signOut: async () => {
      const client = getSupabaseClient();
      return await client.auth.signOut();
    },
    getSession: async () => {
      const client = getSupabaseClient();
      return await client.auth.getSession();
    },
    getUser: async () => {
      const client = getSupabaseClient();
      return await client.auth.getUser();
    }
  },

  // 数据查询封装
  query: {
    // 用户相关
    getUsers: async (options = {}) => {
      const client = getSupabaseClient();
      let query = client.from('users').select('*', options);
      if (options.search) {
        query = query.or(`username.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }
      if (options.status !== undefined) {
        query = query.eq('status', options.status);
      }
      return await query.order('created_at', { ascending: false });
    },

    // 卡密相关
    getCards: async (options = {}) => {
      const client = getSupabaseClient();
      let query = client.from('card_keys').select('*, card_rules(name), card_groups(name)', options);
      if (options.status) {
        query = query.eq('status', options.status);
      }
      return await query.order('created_at', { ascending: false });
    },

    // RPC 节点
    getRpcNodes: async () => {
      const client = getSupabaseClient();
      return await client
        .from('rpc_nodes')
        .select('*')
        .eq('status', true)
        .eq('health_status', 'healthy')
        .order('priority', { ascending: false });
    },

    // 公告
    getAnnouncements: async () => {
      const client = getSupabaseClient();
      return await client
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
    },

    // 系统配置
    getConfig: async (key) => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('system_configs')
        .select('config_value')
        .eq('config_key', key)
        .single();
      return { data: data?.config_value, error };
    }
  },

  // 直接调用 API
  api: {
    rpc: async (action, method = 'GET', body = null) => {
      const response = await fetch(`/api/rpc?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    auth: async (action, method = 'POST', body = null) => {
      const response = await fetch(`/api/auth?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    admin: async (action, method = 'GET', body = null) => {
      const response = await fetch(`/api/admin?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    users: async (action, method = 'GET', body = null) => {
      const response = await fetch(`/api/users${action ? `?action=${action}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    cards: async (action, method = 'GET', body = null) => {
      const response = await fetch(`/api/cards?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    billing: async (action, method = 'GET', body = null) => {
      const response = await fetch(`/api/billing?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      return await response.json();
    },
    logs: async (type, page = 1, limit = 50) => {
      const response = await fetch(`/api/logs?type=${type}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    }
  }
};

export default getSupabaseClient;
