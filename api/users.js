// ============================================
// ENS Manager - 用户管理 API
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
      case 'list':
        return await listUsers(req, res)
      case 'create':
        return await createUser(req, res)
      case 'update':
        return await updateUser(req, res)
      case 'delete':
        return await deleteUser(req, res)
      default:
        return await listUsers(req, res)
    }
  } catch (error) {
    console.error('Users error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function listUsers(req, res) {
  const { page = 1, limit = 50, search } = req.query
  
  let query = supabase.from('users').select('*', { count: 'exact' })
  
  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,card_key.ilike.%${search}%`)
  }
  
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)
  
  if (error) throw error
  
  return res.status(200).json({ users: data, total: count, page: parseInt(page) })
}

async function createUser(req, res) {
  const { username, email, card_key, group_id, balance, expires_at } = req.body
  
  const { data, error } = await supabase.from('users').insert([{
    username, email, card_key, group_id, balance, expires_at
  }]).select().single()
  
  if (error) throw error
  return res.status(201).json({ user: data })
}

async function updateUser(req, res) {
  const { id } = req.query
  const updates = req.body
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return res.status(200).json({ user: data })
}

async function deleteUser(req, res) {
  const { id } = req.query
  
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
  
  return res.status(200).json({ success: true })
}
