import { verifyTOTP } from '../../lib/2fa.js'
import { createToken, verifyToken, parseAuthHeader } from '../../lib/auth.js'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

// POST /api/auth/login - 用户登录
async function handleLogin(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return errorResponse('Username and password are required', 400)
    }

    const adminAccount = process.env.ADMIN_ACCOUNT
    const adminPassword = process.env.ADMIN_PASSWORD

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

// POST /api/auth/verify-2fa - 验证 2FA
async function handleVerify2FA(request) {
  try {
    const { tempToken, code } = await request.json()

    if (!tempToken || !code) {
      return errorResponse('Temporary token and 2FA code are required', 400)
    }

    const admin2FASecret = process.env.ADMIN_2FA_SECRET
    if (!admin2FASecret) {
      return errorResponse('2FA is not configured', 400)
    }

    const isValid = verifyTOTP(admin2FASecret, code)
    if (!isValid) {
      return errorResponse('Invalid 2FA code', 401)
    }

    const username = process.env.ADMIN_ACCOUNT
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

// POST /api/auth/logout - 登出
async function handleLogout(request) {
  return successResponse({}, 'Logout successful')
}

// GET /api/auth/me - 获取当前用户信息
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

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'login'

  if (action === 'verify-2fa') return handleVerify2FA(request)
  if (action === 'logout') return handleLogout(request)
  return handleLogin(request)
}

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'me'

  if (action === 'me') return handleMe(request)
  return errorResponse('Invalid action', 400)
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, GET, OPTIONS }
