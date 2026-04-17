// ============================================
// ENS Manager - 认证 API
// 处理登录、登出、Token 刷新
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, username, password, token } = req.body

    switch (action) {
      case 'login':
        return await handleLogin(req, res, username, password)
      
      case 'verify-token':
        return await handleVerifyToken(req, res, token)
      
      case 'logout':
        return await handleLogout(req, res)
      
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    })
  }
}

// 处理登录
async function handleLogin(req, res, username, password) {
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  // 查询管理员
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single()

  if (error || !admin) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // 验证密码 (使用 pgcrypto 的 crypt 函数)
  const { data: valid } = await supabase.rpc('check_password', {
    p_username: username,
    p_password: password
  })

  // 简单验证：比较哈希 (实际应使用 bcrypt 验证)
  const isValid = await verifyPassword(password, admin.password_hash)
  
  if (!isValid && !valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // 更新最后登录时间
  await supabase
    .from('admins')
    .update({ 
      last_login: new Date().toISOString(),
      last_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    })
    .eq('id', admin.id)

  // 生成 JWT Token
  const jwt = require('jsonwebtoken')
  const accessToken = jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 小时
    },
    process.env.JWT_SECRET
  )

  // 记录操作日志
  await supabase.from('operation_logs').insert([{
    admin_id: admin.id,
    admin_username: admin.username,
    action: 'login',
    ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  }])

  return res.status(200).json({
    success: true,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    },
    token: accessToken
  })
}

// 验证 Token
async function handleVerifyToken(req, res, token) {
  if (!token) {
    return res.status(400).json({ error: 'Token required' })
  }

  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 检查管理员是否存在且活跃
    const { data: admin } = await supabase
      .from('admins')
      .select('id, username, role, is_active')
      .eq('id', decoded.sub)
      .single()

    if (!admin || !admin.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    return res.status(200).json({
      valid: true,
      user: admin
    })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// 处理登出
async function handleLogout(req, res) {
  // 可以在这里添加 token 黑名单逻辑
  return res.status(200).json({ success: true })
}

// 密码验证辅助函数
async function verifyPassword(password, hash) {
  // 简单实现：如果是 bcrypt 哈希
  if (hash.startsWith('$2')) {
    const bcrypt = require('bcryptjs')
    return await bcrypt.compare(password, hash)
  }
  // 如果是 pgcrypto 哈希，需要通过数据库验证
  return false
}
