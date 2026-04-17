import { createToken } from './auth.js'
import { supabase } from './supabase.js'
import { successResponse, errorResponse, handleOptions } from './response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return errorResponse('Username and password are required', 400)
    }

    // Check against environment variables
    const adminAccount = process.env.ADMIN_ACCOUNT
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminAccount || !adminPassword) {
      return errorResponse('Admin credentials not configured', 500)
    }

    // Verify credentials
    if (username !== adminAccount || password !== adminPassword) {
      // Log failed attempt
      await supabase.from('operation_logs').insert({
        action: 'LOGIN_FAILED',
        details: { username, ip: request.headers.get('x-forwarded-for') },
        created_at: new Date().toISOString()
      })

      return errorResponse('Invalid credentials', 401)
    }

    // Generate temporary token for 2FA step (short-lived: 5 minutes)
    const tempToken = await createToken({
      username,
      role: 'pending_2fa',
      permissions: [],
      twoFactorVerified: false,
      temp: true
    }, '5m')

    return successResponse({
      tempToken,
      requires2FA: true
    }, 'Credentials verified. Please enter 2FA code.')

  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
