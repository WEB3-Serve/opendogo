// ============================================
// ENS Manager - 验证码 API
// 发送和验证邮箱验证码
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
    const { action, email, code } = req.body

    switch (action) {
      case 'send-code':
        return await handleSendCode(req, res, email)
      
      case 'verify-code':
        return await handleVerifyCode(req, res, email, code)
      
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Verification code error:', error)
    return res.status(500).json({ 
      error: 'Verification code operation failed',
      message: error.message 
    })
  }
}

// 发送验证码
async function handleSendCode(req, res, email) {
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  // 生成 6 位随机验证码
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 分钟有效期

  // 存储验证码到数据库（覆盖旧记录）
  const { error: insertError } = await supabase
    .from('verification_codes')
    .upsert([{
      email: email,
      code: verifyCode,
      expires_at: expiresAt,
      is_used: false,
      created_at: new Date().toISOString()
    }], { onConflict: 'email' })

  if (insertError) {
    console.error('Save verification code error:', insertError)
    return res.status(500).json({ error: 'Failed to save verification code' })
  }

  // TODO: 调用邮件服务发送邮件
  // 实际项目中应集成 SendGrid、Mailgun、SMTP 等邮件服务
  // 示例：await sendEmail(email, 'ENS Manager 验证码', `您的验证码是：${verifyCode}`)
  
  console.log(`【验证码】${email} 的验证码是：${verifyCode}（有效期 5 分钟）`)

  return res.status(200).json({
    success: true,
    message: 'Verification code sent',
    // 开发模式：返回验证码（生产环境请删除此字段）
    debug_code: process.env.NODE_ENV === 'development' ? verifyCode : undefined
  })
}

// 验证验证码
async function handleVerifyCode(req, res, email, code) {
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' })
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: 'Code must be 6 digits' })
  }

  // 查询验证码
  const { data: record, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !record) {
    return res.status(400).json({ error: 'Invalid or expired code' })
  }

  // 标记验证码为已使用
  await supabase
    .from('verification_codes')
    .update({ is_used: true })
    .eq('id', record.id)

  return res.status(200).json({
    success: true,
    message: 'Verification code validated'
  })
}

// 邮箱格式验证
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
