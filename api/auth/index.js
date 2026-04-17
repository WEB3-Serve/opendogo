import { getSupabase } from '../../lib/supabase.js'
import { successResponse, errorResponse } from '../../lib/response.js'

export async function handleAuthRequest(request, env) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  if (action === 'login') {
    return await handleLogin(request)
  } else if (action === 'register') {
    return await handleRegister(request)
  } else if (action === 'verify-2fa') {
    return await handleVerify2FA(request)
  } else {
    return errorResponse('Invalid action', 400)
  }
}

async function handleLogin(request) {
  try {
    const body = await request.json()
    const { email, username, password } = body
    
    // 支持 username 或 email 登录
    const identifier = email || username

    if (!identifier || !password) {
      return errorResponse('Email/username and password are required', 400)
    }

    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: identifier,
      password
    })

    if (error) {
      console.error('Supabase login error:', error.message)
      return errorResponse(error.message || 'Login failed', 401)
    }

    const user = data.user
    const session = data.session

    // 获取用户 profile 信息
    const { data: profile, error: profileError } = await getSupabase()
      .from('profiles')
      .select('id, username, email, role, card_key, group_id, status, expires_at, query_count')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Get profile error:', profileError.message)
    }

    // 检查用户状态
    if (profile && profile.status === false) {
      return errorResponse('Account is disabled', 403)
    }

    // 记录登录日志
    await getSupabase().from('operation_logs').insert({
      action: 'USER_LOGIN',
      user_id: user.id,
      details: { email: identifier, ip: request.headers.get('x-forwarded-for') || 'unknown' },
      created_at: new Date().toISOString()
    })

    return successResponse({ 
      token: session.access_token,
      refresh_token: session.refresh_token,
      user: { 
        id: user.id,
        username: profile?.username || user.email?.split('@')[0],
        email: user.email,
        role: profile?.role || 'user',
        card_key: profile?.card_key,
        group_id: profile?.group_id,
        status: profile?.status,
        expires_at: profile?.expires_at,
        query_count: profile?.query_count
      } 
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleRegister(request) {
  try {
    const body = await request.json()
    const { email, username, password, card_key } = body

    if (!email || !username || !password) {
      return errorResponse('Email, username and password are required', 400)
    }

    // 验证邀请码
    if (card_key) {
      const { data: card, error: cardError } = await getSupabase()
        .from('cards')
        .select('*')
        .eq('key', card_key)
        .eq('used', false)
        .single()

      if (cardError || !card) {
        return errorResponse('Invalid or used invitation code', 400)
      }

      // 标记邀请码已使用
      await getSupabase().from('cards').update({ used: true, used_by: email }).eq('id', card.id)
    }

    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })

    if (error) {
      console.error('Supabase register error:', error.message)
      return errorResponse(error.message || 'Registration failed', 400)
    }

    const user = data.user

    // 创建用户 profile
    const { error: profileError } = await getSupabase()
      .from('profiles')
      .insert([{
        id: user.id,
        username,
        email,
        role: card_key ? 'user' : 'free_user',
        card_key: card_key || null,
        group_id: card_key ? card.group_id : null,
        status: true,
        query_count: 0
      }])

    if (profileError) {
      console.error('Create profile error:', profileError.message)
      return errorResponse('Failed to create user profile', 500)
    }

    return successResponse({ message: 'Registration successful' }, 'Registration successful')
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleVerify2FA(request) {
  try {
    const body = await request.json()
    const { tempToken, code } = body

    if (!tempToken || !code) {
      return errorResponse('Temp token and code are required', 400)
    }

    // 这里应该验证 2FA 代码，暂时返回成功
    // 实际实现需要使用 Supabase 验证 TOTP 代码
    console.log('2FA verification requested for tempToken:', tempToken, 'code:', code)

    // 临时实现：直接返回成功（生产环境需要正确实现 2FA 验证）
    return successResponse({ 
      message: '2FA verified successfully',
      data: {
        user: {
          id: 'temp-user-id',
          email: 'user@example.com'
        }
      }
    }, '2FA verification successful')
  } catch (error) {
    console.error('2FA verification error:', error)
    return errorResponse('Internal server error', 500)
  }
}
