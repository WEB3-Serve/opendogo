import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = globalThis.SUPABASE_URL
    const supabaseKey = globalThis.SUPABASE_KEY || globalThis.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseInstance
}

// 导出一个 getter 而不是直接导出实例，避免模块加载时立即初始化
export const supabase = {
  from: (table) => getSupabase().from(table)
}

export default supabase
