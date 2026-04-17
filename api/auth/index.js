import { getSupabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, corsHeaders, handleOptions } from '../../lib/response.js'

export async function handleAuthRequest(request, env) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  if (action === 'login') {
    return await handleLogin(request)
  } else if (action === 'register') {
    return await handleRegister(request)
  } else if (action === 'logout') {
    return await handleLogout(request)
  } else if (action === 'session') {
    return await handleGetSession(request)
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
      return errorResponse('Email/Username and password are required', 400)
    }

    // 使用 Supabase Auth 进行登录（仅支持邮箱）
    const loginEmail = identifier.includes('@') ? identifier : null
    
    if (!loginEmail) {
      return errorResponse('Please use email to login', 400)
    }

    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: loginEmail,
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

    if (profileError && profileError.code !== 'PGRST116') {
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

    // 验证密码长度
    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9]{4,20}$/.test(username)) {
      return errorResponse('Username must be 4-20 alphanumeric characters', 400)
    }

    // 验证邀请码（如果提供）
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

    // 使用 Supabase Auth 进行注册
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

    return successResponse({ 
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        username
      }
    }, 'Registration successful')
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// 登出功能
async function handleLogout(request) {
  try {
    // 从请求头获取 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Authorization token required', 401)
    }

    const token = authHeader.substring(7)
    
    // 调用 Supabase 登出
    const { error } = await getSupabase().auth.signOut()

    if (error) {
      console.error('Supabase logout error:', error.message)
      return errorResponse(error.message || 'Logout failed', 400)
    }

    return successResponse({ message: 'Logout successful' }, 'Logout successful')
  } catch (error) {
    console.error('Logout error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// 获取当前会话
async function handleGetSession(request) {
  try {
    // 从请求头获取 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Authorization token required', 401)
    }

    const token = authHeader.substring(7)
    
    // 获取用户信息
    const { data: { user }, error } = await getSupabase().auth.getUser(token)

    if (error || !user) {
      return errorResponse('Invalid or expired token', 401)
    }

    // 获取用户 profile 信息
    const { data: profile, error: profileError } = await getSupabase()
      .from('profiles')
      .select('id, username, email, role, card_key, group_id, status, expires_at, query_count')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Get profile error:', profileError.message)
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: profile?.username || user.email?.split('@')[0],
        role: profile?.role || 'user',
        card_key: profile?.card_key,
        group_id: profile?.group_id,
        status: profile?.status,
        expires_at: profile?.expires_at,
        query_count: profile?.query_count
      }
    }, 'Session retrieved successfully')
  } catch (error) {
    console.error('Get session error:', error)
    return errorResponse('Internal server error', 500)
  }
}
