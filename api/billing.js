// ============================================
// ENS Manager - 计费系统 API
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
      case 'records': return await getRecords(req, res)
      case 'charge': return await chargeUser(req, res)
      case 'consume': return await consumeBalance(req, res)
      default: return await getRecords(req, res)
    }
  } catch (error) {
    console.error('Billing error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getRecords(req, res) {
  const { user_id, type, page = 1, limit = 50 } = req.query
  
  let query = supabase.from('billing_records').select('*', { count: 'exact' })
  if (user_id) query = query.eq('user_id', user_id)
  if (type) query = query.eq('type', type)
  
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)
  
  if (error) throw error
  return res.status(200).json({ records: data, total: count })
}

async function chargeUser(req, res) {
  const { user_id, amount, description } = req.body
  
  const { data: user } = await supabase.from('users').select('balance').eq('id', user_id).single()
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  const balanceBefore = parseFloat(user.balance) || 0
  const balanceAfter = balanceBefore + parseFloat(amount)
  
  await supabase.from('users').update({ balance: balanceAfter }).eq('id', user_id)
  
  const { data } = await supabase.from('billing_records').insert([{
    user_id, type: 'charge', amount, balance_before: balanceBefore, balance_after: balanceAfter, description
  }]).select().single()
  
  return res.status(201).json({ record: data })
}

async function consumeBalance(req, res) {
  const { user_id, amount, description, related_query_id } = req.body
  
  const { data: user } = await supabase.from('users').select('balance').eq('id', user_id).single()
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  const balanceBefore = parseFloat(user.balance) || 0
  if (balanceBefore < amount) return res.status(400).json({ error: 'Insufficient balance' })
  
  const balanceAfter = balanceBefore - amount
  await supabase.from('users').update({ balance: balanceAfter }).eq('id', user_id)
  
  const { data } = await supabase.from('billing_records').insert([{
    user_id, type: 'consume', amount, balance_before: balanceBefore, balance_after: balanceAfter, description, related_query_id
  }]).select().single()
  
  return res.status(200).json({ record: data })
}
