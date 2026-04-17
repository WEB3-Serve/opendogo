// ============================================
// ENS Manager - 管理后台 API
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { action } = req.query

    switch (action) {
      case 'stats': return await getStats(req, res)
      case 'config': return await getConfig(req, res)
      case 'update-config': return await updateConfig(req, res)
      default: return await getStats(req, res)
    }
  } catch (error) {
    console.error('Admin error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getStats(req, res) {
  const [users, cards, queries, nodes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('card_keys').select('*', { count: 'exact', head: true }),
    supabase.from('query_logs').select('*', { count: 'exact', head: true }),
    supabase.from('rpc_nodes').select('*', { count: 'exact', head: true }).eq('is_active', true)
  ])

  return res.status(200).json({
    stats: {
      totalUsers: users.count || 0,
      totalCards: cards.count || 0,
      totalQueries: queries.count || 0,
      activeNodes: nodes.count || 0
    }
  })
}

async function getConfig(req, res) {
  const { key } = req.query
  let query = supabase.from('system_config').select('*')
  if (key) query = query.eq('config_key', key)
  
  const { data, error } = await query.order('config_key')
  if (error) throw error
  
  return res.status(200).json({ config: data })
}

async function updateConfig(req, res) {
  const { key, value } = req.body
  
  const { data, error } = await supabase
    .from('system_config')
    .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' })
    .select()
    .single()
  
  if (error) throw error
  return res.status(200).json({ config: data })
}
