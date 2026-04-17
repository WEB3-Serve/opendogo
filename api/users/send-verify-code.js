import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  
  try {
    const body = await request.json()
    const { email } = body
    
    // Validation
    if (!email) {
      return errorResponse('Email is required', 400)
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Invalid email format', 400)
    }
    
    // TODO: 集成真实的邮件发送服务（如 SendGrid、Resend、SMTP 等）
    // 这里生成一个 6 位随机验证码
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 将验证码存储到数据库，设置 5 分钟过期时间
    const { error } = await supabase
      .from('verify_codes')
      .insert({
        email,
        code: verifyCode,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 分钟后过期
        used: false,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to store verify code:', error)
      return errorResponse(`Failed to send code: ${error.message}`, 500)
    }
    
    // TODO: 调用邮件服务发送邮件
    // 示例：await sendEmail({ to: email, subject: '验证码', html: `您的验证码是：${verifyCode}` })
    console.log(`Verification code for ${email}: ${verifyCode}`)
    
    return successResponse({ 
      message: 'Verification code sent. Please check your email.' 
    }, 'Code sent successfully')
    
  } catch (error) {
    console.error('Send verify code error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
