// ============================================
// ENS Manager - Supabase 客户端配置
// 前端专用 (仅包含匿名 Key，安全)
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://yxulnfkndzjztqqtpgnm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_W7yTR46_iifpnLDVQHyPtw_hiK5OPWN'

// 创建 Supabase 客户端实例
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'ens-manager-web'
    }
  }
})

// 认证相关方法
export const auth = {
  async signIn(username, password) {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    })
    return await response.json()
  },
  async signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('ens_user')
    window.location.href = '/'
  },
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  async isLoggedIn() {
    const user = await this.getCurrentUser()
    return !!user
  }
}

// 数据库查询辅助方法
export const db = {
  async addQueryLog(data) {
    const { data: result, error } = await supabase
      .from('query_logs')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return result
  },
  async getUserQueryHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('query_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },
  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async getConfig(key) {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', key)
      .single()
    if (error) throw error
    return data?.config_value
  },
  async getAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false })
    if (error) throw error
    return data
  }
}

// RPC 节点管理
export const rpc = {
  async getActiveNodes() {
    const { data, error } = await supabase
      .from('rpc_nodes')
      .select('*')
      .eq('is_active', true)
      .eq('health_status', 'healthy')
      .order('priority', { ascending: true })
      .order('weight', { ascending: false })
    if (error) throw error
    return data
  },
  async call(method, params) {
    const response = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this._getToken()}`
      },
      body: JSON.stringify({ method, params })
    })
    return await response.json()
  },
  async _getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }
}

export default { supabase, auth, db, rpc }
