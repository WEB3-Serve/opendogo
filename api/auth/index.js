import { verifyTOTP } from '../../lib/2fa.js'
import { createToken, verifyToken, parseAuthHeader } from '../../lib/auth.js'
import { nanoid } from 'nanoid'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

// ==================== AUTH 模块 ====================

async function handleLogin(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return errorResponse('Username and password are required', 400)
    }

    const adminAccount = globalThis.ADMIN_ACCOUNT
    const adminPassword = globalThis.ADMIN_PASSWORD

    if (!adminAccount || !adminPassword) {
      return errorResponse('Admin credentials not configured', 500)
    }

    if (username !== adminAccount || password !== adminPassword) {
      await supabase.from('operation_logs').insert({
        action: 'LOGIN_FAILED',
        details: { username, ip: request.headers.get('x-forwarded-for') },
        created_at: new Date().toISOString()
      })
      return errorResponse('Invalid credentials', 401)
    }

    const tempToken = await createToken({
      username,
      role: 'pending_2fa',
      permissions: [],
      twoFactorVerified: false,
      temp: true
    }, '5m')

    return successResponse({ tempToken, requires2FA: true }, 'Credentials verified. Please enter 2FA code.')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleVerify2FA(request) {
  try {
    const { tempToken, code } = await request.json()

    if (!tempToken || !code) {
      return errorResponse('Temporary token and 2FA code are required', 400)
    }

    const admin2FASecret = globalThis.ADMIN_2FA_SECRET
    if (!admin2FASecret) {
      return errorResponse('2FA is not configured', 400)
    }

    const isValid = verifyTOTP(admin2FASecret, code)
    if (!isValid) {
      return errorResponse('Invalid 2FA code', 401)
    }

    const username = globalThis.ADMIN_ACCOUNT
    const token = await createToken({
      username,
      role: 'super_admin',
      permissions: ['*'],
      twoFactorVerified: true
    })

    await supabase.from('operation_logs').insert({
      action: '2FA_VERIFIED',
      details: { username, ip: request.headers.get('x-forwarded-for') },
      created_at: new Date().toISOString()
    })

    return successResponse({ token, user: { username, role: 'super_admin' } }, '2FA verification successful')
  } catch (error) {
    console.error('2FA verification error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleLogout(request) {
  return successResponse({}, 'Logout successful')
}

async function handleMe(request) {
  try {
    const token = parseAuthHeader(request.headers.get('Authorization'))
    if (!token) {
      return errorResponse('Unauthorized', 401)
    }

    const result = await verifyToken(token)
    if (!result.valid) {
      return errorResponse('Invalid or expired token', 401)
    }

    return successResponse({ user: result.payload })
  } catch (error) {
    console.error('Get me error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ==================== CARDS 模块 ====================

async function handleCardsList(request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const status = url.searchParams.get('status')

    let query = supabase
      .from('card_keys')
      .select('*, card_rules(name), card_groups(name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status !== null) {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Get cards error:', error)
      return errorResponse('Failed to fetch cards', 500)
    }

    return successResponse({
      cards: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get cards error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleCardsRules(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('card_rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get card rules error:', error)
        return errorResponse('Failed to fetch card rules', 500)
      }

      return successResponse(data)
    } catch (error) {
      console.error('Get card rules error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await request.json()
      const { name, valid_days = 30, max_queries_per_day = 100, allow_batch = true, max_batch_size = 50 } = body

      const { data, error } = await supabase
        .from('card_rules')
        .insert({
          name,
          valid_days,
          max_queries_per_day,
          allow_batch,
          max_batch_size,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create card rule error:', error)
        return errorResponse(`Failed to create rule: ${error.message}`, 400)
      }

      return successResponse(data, 'Rule created successfully')
    } catch (error) {
      console.error('Create card rule error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

async function handleCardsGenerate(request) {
  try {
    const body = await request.json()
    const { count = 1, rule_id, group_id, expires_at, max_uses = 1 } = body

    const cards = []
    
    for (let i = 0; i < count; i++) {
      const cardKey = `ck_${nanoid(32)}`
      
      cards.push({
        card_key: cardKey,
        rule_id,
        group_id,
        status: 'active',
        expires_at,
        max_uses,
        current_uses: 0,
        created_at: new Date().toISOString()
      })
    }

    const { data, error } = await supabase
      .from('card_keys')
      .insert(cards)
      .select()

    if (error) {
      console.error('Generate cards error:', error)
      return errorResponse(`Failed to generate cards: ${error.message}`, 400)
    }

    return successResponse({ cards: data, count: data.length }, `Successfully generated ${data.length} card(s)`)
  } catch (error) {
    console.error('Generate cards error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleCardsGroups(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('card_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get card groups error:', error)
        return errorResponse('Failed to fetch card groups', 500)
      }

      return successResponse(data)
    } catch (error) {
      console.error('Get card groups error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await request.json()
      const { name, description } = body

      const { data, error } = await supabase
        .from('card_groups')
        .insert({
          name,
          description,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create card group error:', error)
        return errorResponse(`Failed to create group: ${error.message}`, 400)
      }

      return successResponse(data, 'Group created successfully')
    } catch (error) {
      console.error('Create card group error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

// ==================== USERS 模块 ====================

async function handleUsersList(request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status')

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (status !== null) {
      query = query.eq('status', status === 'true')
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Get users error:', error)
      return errorResponse('Failed to fetch users', 500)
    }

    return successResponse({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleUsersCreate(request) {
  try {
    const body = await request.json()
    const { username, email, card_key, group_id, expires_at, status = true } = body

    const finalCardKey = card_key || `ck_${nanoid(32)}`

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        card_key: finalCardKey,
        group_id,
        expires_at,
        status,
        query_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Create user error:', error)
      return errorResponse(`Failed to create user: ${error.message}`, 400)
    }

    return successResponse(data, 'User created successfully')
  } catch (error) {
    console.error('Create user error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleUsersRegister(request) {
  try {
    const body = await request.json()
    const { username, email, password, verify_code } = body

    if (!username || !email || !password || !verify_code) {
      return errorResponse('Username, email, password and verification code are required', 400)
    }

    if (!/^[a-zA-Z0-9]{4,20}$/.test(username)) {
      return errorResponse('Username must be 4-20 alphanumeric characters', 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Invalid email format', 400)
    }

    if (!/^\d{6}$/.test(verify_code)) {
      return errorResponse('Verification code must be 6 digits', 400)
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }

    const now = new Date().toISOString()
    const { data: verifyData, error: verifyError } = await supabase
      .from('verify_codes')
      .select('id, email, code, expires_at, used')
      .eq('email', email)
      .eq('code', verify_code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verifyData) {
      return errorResponse('Invalid or expired verification code', 400)
    }

    await supabase
      .from('verify_codes')
      .update({ used: true })
      .eq('id', verifyData.id)

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .or(`email.eq.${email}`)
      .single()

    if (existingUser) {
      return errorResponse('Username or email already exists', 409)
    }

    const cardKey = `ck_${nanoid(32)}`

    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    const passwordHash = Array.from(new Uint8Array(exportedKey))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const passwordSalt = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: `${passwordSalt}:${passwordHash}`,
        card_key: cardKey,
        group_id: null,
        expires_at: null,
        status: true,
        query_count: 0,
        created_at: new Date().toISOString()
      })
      .select('id, username, email, card_key, created_at')
      .single()

    if (error) {
      console.error('Register error:', error)
      return errorResponse(`Failed to create user: ${error.message}`, 400)
    }

    return successResponse(data, 'User registered successfully')
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleUsersSendVerifyCode(request) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return errorResponse('Email is required', 400)
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Invalid email format', 400)
    }
    
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    const { error } = await supabase
      .from('verify_codes')
      .insert({
        email,
        code: verifyCode,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        used: false,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to store verify code:', error)
      return errorResponse(`Failed to send code: ${error.message}`, 500)
    }
    
    console.log(`Verification code for ${email}: ${verifyCode}`)
    
    return successResponse({ message: 'Verification code sent. Please check your email.' }, 'Code sent successfully')
  } catch (error) {
    console.error('Send verify code error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleUsersGroups(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get user groups error:', error)
        return errorResponse('Failed to fetch user groups', 500)
      }

      return successResponse(data)
    } catch (error) {
      console.error('Get user groups error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await request.json()
      const { name, permissions = {} } = body

      const { data, error } = await supabase
        .from('user_groups')
        .insert({
          name,
          permissions,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create user group error:', error)
        return errorResponse(`Failed to create group: ${error.message}`, 400)
      }

      return successResponse(data, 'Group created successfully')
    } catch (error) {
      console.error('Create user group error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

// ==================== CONFIG 模块 ====================

async function handleConfigSite(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Get site config error:', error)
        return errorResponse('Failed to fetch site config', 500)
      }

      return successResponse(data || {})
    } catch (error) {
      console.error('Get site config error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'PUT') {
    try {
      const body = await request.json()
      
      const { data: current } = await supabase
        .from('site_config')
        .select('id')
        .single()

      let result
      
      if (current) {
        const { data, error } = await supabase
          .from('site_config')
          .update({
            ...body,
            updated_at: new Date().toISOString()
          })
          .eq('id', current.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('site_config')
          .insert({
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      return successResponse(result, 'Site config saved successfully')
    } catch (error) {
      console.error('Save site config error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

async function handleConfigAnnouncement(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit')) || 10
      const published = url.searchParams.get('published')

      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (published === 'true') {
        query = query
          .eq('published', true)
          .lte('publish_at', new Date().toISOString())
          .or(`expire_at.is.null,gte.expire_at.${new Date().toISOString()}`)
      }

      const { data, error } = await query.limit(limit)

      if (error) {
        console.error('Get announcements error:', error)
        return errorResponse('Failed to fetch announcements', 500)
      }

      return successResponse(data)
    } catch (error) {
      console.error('Get announcements error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await request.json()
      const { title, content, type = 'info', published = false, publish_at, expire_at } = body

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          type,
          published,
          publish_at: publish_at || new Date().toISOString(),
          expire_at,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create announcement error:', error)
        return errorResponse(`Failed to create announcement: ${error.message}`, 400)
      }

      return successResponse(data, 'Announcement created successfully')
    } catch (error) {
      console.error('Create announcement error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

async function handleConfigSystem(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Get system config error:', error)
        return errorResponse('Failed to fetch system config', 500)
      }

      return successResponse(data || {})
    } catch (error) {
      console.error('Get system config error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'PUT') {
    try {
      const body = await request.json()
      
      const { data: current } = await supabase
        .from('system_config')
        .select('id')
        .single()

      let result
      
      if (current) {
        const { data, error } = await supabase
          .from('system_config')
          .update({
            ...body,
            updated_at: new Date().toISOString()
          })
          .eq('id', current.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('system_config')
          .insert({
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      return successResponse(result, 'System config saved successfully')
    } catch (error) {
      console.error('Save system config error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

async function handleConfigDomainAuth(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('domain_authorizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return successResponse(data, 'Domain authorizations retrieved successfully')
    } catch (error) {
      console.error('Get domain authorizations error:', error)
      return errorResponse('Failed to get domain authorizations', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const { domain, description, expires_at, is_active } = await request.json()

      if (!domain) {
        return errorResponse('Domain is required', 400)
      }

      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
      if (!domainRegex.test(domain)) {
        return errorResponse('Invalid domain format', 400)
      }

      const { data: existing } = await supabase
        .from('domain_authorizations')
        .select('id')
        .eq('domain', domain.toLowerCase())
        .single()

      if (existing) {
        return errorResponse('Domain already authorized', 409)
      }

      const { data, error } = await supabase
        .from('domain_authorizations')
        .insert({
          domain: domain.toLowerCase(),
          description: description || '',
          expires_at: expires_at || null,
          is_active: is_active !== false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('operation_logs').insert({
        action: 'DOMAIN_AUTH_ADD',
        details: { domain, description },
        created_at: new Date().toISOString()
      })

      return successResponse(data, 'Domain authorization added successfully')
    } catch (error) {
      console.error('Add domain authorization error:', error)
      return errorResponse('Failed to add domain authorization', 500)
    }
  }
  
  if (method === 'PUT') {
    try {
      const { id, domain, description, expires_at, is_active } = await request.json()

      if (!id) {
        return errorResponse('ID is required', 400)
      }

      const updateData = {}
      if (domain) {
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
        if (!domainRegex.test(domain)) {
          return errorResponse('Invalid domain format', 400)
        }
        updateData.domain = domain.toLowerCase()
      }
      if (description !== undefined) updateData.description = description
      if (expires_at !== undefined) updateData.expires_at = expires_at
      if (is_active !== undefined) updateData.is_active = is_active

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('domain_authorizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('operation_logs').insert({
        action: 'DOMAIN_AUTH_UPDATE',
        details: { id, ...updateData },
        created_at: new Date().toISOString()
      })

      return successResponse(data, 'Domain authorization updated successfully')
    } catch (error) {
      console.error('Update domain authorization error:', error)
      return errorResponse('Failed to update domain authorization', 500)
    }
  }
  
  if (method === 'DELETE') {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return errorResponse('ID is required', 400)
      }

      const { data: record } = await supabase
        .from('domain_authorizations')
        .select('*')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('domain_authorizations')
        .delete()
        .eq('id', id)

      if (error) throw error

      await supabase.from('operation_logs').insert({
        action: 'DOMAIN_AUTH_DELETE',
        details: { id, domain: record?.domain },
        created_at: new Date().toISOString()
      })

      return successResponse(null, 'Domain authorization deleted successfully')
    } catch (error) {
      console.error('Delete domain authorization error:', error)
      return errorResponse('Failed to delete domain authorization', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

// ==================== DASHBOARD 模块 ====================

async function handleDashboardStats(request) {
  try {
    const [usersCount, cardsCount, rpcCount, logsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('card_keys').select('*', { count: 'exact', head: true }),
      supabase.from('rpc_nodes').select('*', { count: 'exact', head: true }),
      supabase.from('api_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    const rpcHealth = await supabase
      .from('rpc_nodes')
      .select('health_status')
      .eq('status', true)

    const healthyNodes = rpcHealth.data?.filter(n => n.health_status === 'healthy').length || 0
    const totalNodes = rpcHealth.data?.length || 0

    const recentLogins = await supabase
      .from('operation_logs')
      .select('created_at')
      .eq('action', 'LOGIN')
      .order('created_at', { ascending: false })
      .limit(10)

    const cardStats = await supabase
      .from('card_keys')
      .select('status')
    
    const statusCounts = cardStats.data?.reduce((acc, card) => {
      acc[card.status] = (acc[card.status] || 0) + 1
      return acc
    }, {}) || {}

    return successResponse({
      overview: {
        totalUsers: usersCount.count || 0,
        totalCards: cardsCount.count || 0,
        totalRPCs: rpcCount.count || 0,
        todayApiCalls: logsCount.count || 0
      },
      rpcHealth: {
        healthy: healthyNodes,
        total: totalNodes,
        percentage: totalNodes > 0 ? Math.round((healthyNodes / totalNodes) * 100) : 0
      },
      cardStats: {
        active: statusCounts.active || 0,
        used: statusCounts.used || 0,
        expired: statusCounts.expired || 0,
        frozen: statusCounts.frozen || 0
      },
      recentLogins: recentLogins.data?.map(log => log.created_at) || []
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ==================== RPC 模块 ====================

async function checkRPCHealth(url, timeout = 5000) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      }),
      signal: controller.signal
    })
    
    clearTimeout(id)
    
    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` }
    }
    
    const data = await response.json()
    if (data.error || !data.result) {
      return { healthy: false, error: data.error?.message || 'No result' }
    }
    
    return { healthy: true, latency: Date.now() }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}

async function handleRPCHealth(request) {
  try {
    const body = await request.json()
    const { node_id } = body

    let query = supabase.from('rpc_nodes').select('*')
    
    if (node_id) {
      query = query.eq('id', node_id)
    } else {
      query = query.eq('status', true)
    }

    const { data: nodes, error } = await query

    if (error) {
      console.error('Health check error:', error)
      return errorResponse('Failed to fetch RPC nodes', 500)
    }

    const results = []
    
    for (const node of nodes) {
      const startTime = Date.now()
      const healthResult = await checkRPCHealth(node.url)
      const latency = healthResult.healthy ? Date.now() - startTime : null
      
      await supabase
        .from('rpc_nodes')
        .update({
          health_status: healthResult.healthy ? 'healthy' : 'unhealthy',
          last_health_check: new Date().toISOString(),
          avg_response_time: latency
        })
        .eq('id', node.id)

      results.push({
        id: node.id,
        name: node.name,
        url: node.url,
        healthy: healthResult.healthy,
        latency,
        error: healthResult.error
      })
    }

    return successResponse({
      results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.healthy).length,
        unhealthy: results.filter(r => !r.healthy).length
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleRPCList(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('rpc_nodes')
        .select('*, rpc_groups(name)')
        .order('priority', { ascending: false })

      if (error) {
        console.error('Get RPC nodes error:', error)
        return errorResponse('Failed to fetch RPC nodes', 500)
      }

      return successResponse(data)
    } catch (error) {
      console.error('Get RPC nodes error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await request.json()
      const { name, url, group_id, priority = 0, weight = 1, status = true } = body

      const { data, error } = await supabase
        .from('rpc_nodes')
        .insert({
          name,
          url,
          group_id,
          priority,
          weight,
          status,
          health_status: 'unknown',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create RPC node error:', error)
        return errorResponse(`Failed to create node: ${error.message}`, 400)
      }

      return successResponse(data, 'RPC node created successfully')
    } catch (error) {
      console.error('Create RPC node error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

// ==================== ENS 模块 ====================

const ensCache = new Map()
const ENS_CACHE_TTL = 5 * 60 * 1000

function getFromEnsCache(key) {
  const item = ensCache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > ENS_CACHE_TTL) {
    ensCache.delete(key)
    return null
  }
  return item.data
}

function setEnsCache(key, data) {
  ensCache.set(key, { data, timestamp: Date.now() })
}

async function handleENSQuery(request) {
  const method = request.method
  
  if (method === 'GET') {
    try {
      const { searchParams } = new URL(request.url)
      const domain = searchParams.get('domain')
      const rpcUrl = searchParams.get('rpcUrl')

      if (!domain) {
        return errorResponse('Domain parameter is required', 400)
      }

      const cacheKey = `ens:${domain}`
      const cached = getFromEnsCache(cacheKey)

      if (cached) {
        return successResponse({ ...cached, fromCache: true }, 'Retrieved from cache')
      }

      const targetRpcUrl = rpcUrl || globalThis.DEFAULT_RPC_URL || 'https://eth.llamarpc.com'
      
      const nodeId = namehash(domain)
      const owner = await queryENSOwner(nodeId, targetRpcUrl)
      
      const result = {
        domain,
        owner: owner || '0x0000000000000000000000000000000000000000',
        available: !owner || owner === '0x0000000000000000000000000000000000000000',
        queriedAt: new Date().toISOString()
      }
      
      setEnsCache(cacheKey, result)

      return successResponse(result, 'Query completed')
    } catch (error) {
      console.error('ENS query error:', error)
      return errorResponse('Failed to query ENS domain', 500)
    }
  }
  
  if (method === 'POST') {
    try {
      const { domains, rpcUrl } = await request.json()

      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return errorResponse('Domains array is required', 400)
      }

      if (domains.length > 100) {
        return errorResponse('Maximum 100 domains per request', 400)
      }

      const targetRpcUrl = rpcUrl || globalThis.DEFAULT_RPC_URL || 'https://eth.llamarpc.com'
      const results = []

      for (const domain of domains) {
        const cacheKey = `ens:${domain}`
        const cached = getFromEnsCache(cacheKey)
        
        if (cached) {
          results.push({ ...cached, fromCache: true })
        } else {
          const nodeId = namehash(domain)
          const owner = await queryENSOwner(nodeId, targetRpcUrl)
          const result = {
            domain,
            owner: owner || '0x0000000000000000000000000000000000000000',
            available: !owner || owner === '0x0000000000000000000000000000000000000000',
            queriedAt: new Date().toISOString()
          }
          setEnsCache(cacheKey, result)
          results.push(result)
        }
      }

      await supabase.from('api_logs').insert({
        endpoint: '/api/ens/query',
        method: 'POST',
        status_code: 200,
        response_time: 0,
        request_data: { domainsCount: domains.length },
        created_at: new Date().toISOString()
      })

      return successResponse(results, 'Query completed')
    } catch (error) {
      console.error('ENS query error:', error)
      return errorResponse('Failed to query ENS domains', 500)
    }
  }
  
  return errorResponse('Method not allowed', 405)
}

function namehash(name) {
  let node = Array(32).fill(0)
  
  if (name) {
    const parts = name.toLowerCase().split('.')
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      const partHash = keccak256(part)
      node = keccak256([...node, ...partHash])
    }
  }
  
  return '0x' + node.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function keccak256(data) {
  if (typeof data === 'string') {
    const encoder = new TextEncoder()
    data = Array.from(encoder.encode(data))
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  return hashArray
}

async function queryENSOwner(nodeId, rpcUrl) {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          data: '0x02571be3' + nodeId.slice(2)
        }, 'latest']
      })
    })
    
    const result = await response.json()
    if (result.error || !result.result) {
      return null
    }
    
    return '0x' + result.result.slice(-40)
  } catch (error) {
    console.error('Query ENS owner failed:', error)
    return null
  }
}

// ==================== 主路由处理 ====================

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const module = pathParts[pathParts.length - 2] || 'auth'
  const action = url.searchParams.get('action')
  
  // Auth routes
  if (module === 'auth') {
    if (action === 'verify-2fa') return handleVerify2FA(request)
    if (action === 'logout') return handleLogout(request)
    return handleLogin(request)
  }
  
  // Cards routes
  if (module === 'cards') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'list') return handleCardsList(request)
    if (type === 'rules') return handleCardsRules(request)
    if (type === 'generate') return handleCardsGenerate(request)
    if (type === 'groups') return handleCardsGroups(request)
  }
  
  // Users routes
  if (module === 'users') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'list') return handleUsersList(request)
    if (type === 'create') return handleUsersCreate(request)
    if (type === 'register') return handleUsersRegister(request)
    if (type === 'send-verify-code') return handleUsersSendVerifyCode(request)
    if (type === 'groups') return handleUsersGroups(request)
  }
  
  // Config routes
  if (module === 'config') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'site') return handleConfigSite(request)
    if (type === 'announcement') return handleConfigAnnouncement(request)
    if (type === 'system') return handleConfigSystem(request)
    if (type === 'domain-auth') return handleConfigDomainAuth(request)
  }
  
  // Dashboard routes
  if (module === 'dashboard') {
    return handleDashboardStats(request)
  }
  
  // RPC routes
  if (module === 'rpc') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'health') return handleRPCHealth(request)
    if (type === 'list') return handleRPCList(request)
  }
  
  // ENS routes
  if (module === 'ens') {
    return handleENSQuery(request)
  }
  
  return errorResponse('Not found', 404)
}

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const module = pathParts[pathParts.length - 2] || 'auth'
  const action = url.searchParams.get('action')
  
  // Auth routes
  if (module === 'auth') {
    if (action === 'me') return handleMe(request)
    return errorResponse('Invalid action', 400)
  }
  
  // Cards routes
  if (module === 'cards') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'list') return handleCardsList(request)
    if (type === 'rules') return handleCardsRules(request)
    if (type === 'groups') return handleCardsGroups(request)
  }
  
  // Users routes
  if (module === 'users') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'list') return handleUsersList(request)
    if (type === 'groups') return handleUsersGroups(request)
  }
  
  // Config routes
  if (module === 'config') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'site') return handleConfigSite(request)
    if (type === 'announcement') return handleConfigAnnouncement(request)
    if (type === 'system') return handleConfigSystem(request)
    if (type === 'domain-auth') return handleConfigDomainAuth(request)
  }
  
  // Dashboard routes
  if (module === 'dashboard') {
    return handleDashboardStats(request)
  }
  
  // RPC routes
  if (module === 'rpc') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'list') return handleRPCList(request)
  }
  
  // ENS routes
  if (module === 'ens') {
    return handleENSQuery(request)
  }
  
  return errorResponse('Not found', 404)
}

export async function PUT(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const module = pathParts[pathParts.length - 2] || 'config'
  
  // Config routes
  if (module === 'config') {
    const type = pathParts[pathParts.length - 1]
    if (type === 'site') return handleConfigSite(request)
    if (type === 'system') return handleConfigSystem(request)
  }
  
  // Config domain-auth routes
  if (pathParts.includes('domain-auth')) {
    return handleConfigDomainAuth(request)
  }
  
  return errorResponse('Not found', 404)
}

export async function DELETE(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  
  // Config domain-auth routes
  if (pathParts.includes('domain-auth')) {
    return handleConfigDomainAuth(request)
  }
  
  return errorResponse('Not found', 404)
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

const handler = {
  fetch: async (request, env, ctx) => {
    // Set environment variables from env object
    Object.keys(env).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = env[key]
      }
    })
    
    const method = request.method.toUpperCase()
    
    if (method === 'GET') return GET(request)
    if (method === 'POST') return POST(request)
    if (method === 'PUT') return PUT(request)
    if (method === 'DELETE') return DELETE(request)
    if (method === 'OPTIONS') return OPTIONS(request)
    
    return errorResponse('Method not allowed', 405)
  }
}

export default handler
