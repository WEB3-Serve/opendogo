// ============================================
// ENS Manager - 卡密管理 API
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { action } = req.query

    switch (action) {
      case 'list': return await listCards(req, res)
      case 'generate': return await generateCards(req, res)
      case 'activate': return await activateCard(req, res)
      case 'delete': return await deleteCard(req, res)
      default: return await listCards(req, res)
    }
  } catch (error) {
    console.error('Cards error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function listCards(req, res) {
  const { status, page = 1, limit = 50 } = req.query
  
  let query = supabase.from('card_keys').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)
  
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)
  
  if (error) throw error
  return res.status(200).json({ cards: data, total: count })
}

async function generateCards(req, res) {
  const { count = 1, rule_name, valid_days, balance_on_activate, group_id } = req.body
  
  const cards = []
  for (let i = 0; i < count; i++) {
    const card_key = 'ens_' + Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8)
    const expires_at = new Date(Date.now() + (valid_days || 30) * 24 * 60 * 60 * 1000)
    
    cards.push({ card_key, rule_name, valid_days, balance_on_activate, group_id, expires_at })
  }
  
  const { data, error } = await supabase.from('card_keys').insert(cards).select()
  if (error) throw error
  
  return res.status(201).json({ cards: data })
}

async function activateCard(req, res) {
  const { card_key, user_id } = req.body
  
  const { data: card } = await supabase
    .from('card_keys')
    .select('*')
    .eq('card_key', card_key)
    .eq('status', 'active')
    .single()
  
  if (!card) return res.status(404).json({ error: 'Invalid or used card' })
  
  // 更新卡密状态
  await supabase.from('card_keys').update({
    status: 'used', used_by: user_id, used_at: new Date().toISOString(), current_uses: card.current_uses + 1
  }).eq('id', card.id)
  
  // 更新或创建用户
  const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single()
  
  if (user) {
    await supabase.from('users').update({
      balance: (parseFloat(user.balance) || 0) + (parseFloat(card.balance_on_activate) || 0),
      group_id: card.group_id,
      group_name: card.group_name
    }).eq('id', user_id)
  }
  
  return res.status(200).json({ success: true, balance_added: card.balance_on_activate })
}

async function deleteCard(req, res) {
  const { id } = req.query
  const { error } = await supabase.from('card_keys').delete().eq('id', id)
  if (error) throw error
  return res.status(200).json({ success: true })
}
