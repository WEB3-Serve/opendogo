// ============================================
// ENS Manager - 日志查询 API
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { type } = req.query

    switch (type) {
      case 'operation': return await getOperationLogs(req, res)
      case 'query': return await getQueryLogs(req, res)
      default: return await getQueryLogs(req, res)
    }
  } catch (error) {
    console.error('Logs error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getOperationLogs(req, res) {
  const { admin_id, page = 1, limit = 50 } = req.query
  
  let query = supabase.from('operation_logs').select('*', { count: 'exact' })
  if (admin_id) query = query.eq('admin_id', admin_id)
  
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)
  
  if (error) throw error
  return res.status(200).json({ logs: data, total: count })
}

async function getQueryLogs(req, res) {
  const { user_id, status, page = 1, limit = 50 } = req.query
  
  let query = supabase.from('query_logs').select('*', { count: 'exact' })
  if (user_id) query = query.eq('user_id', user_id)
  if (status) query = query.eq('status', status)
  
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)
  
  if (error) throw error
  return res.status(200).json({ logs: data, total: count })
}
