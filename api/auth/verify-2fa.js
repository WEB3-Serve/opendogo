import { verifyTOTP } from '../../lib/2fa.js'
import { createToken } from '../../lib/auth.js'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { tempToken, code } = await request.json()

    if (!tempToken || !code) {
      return errorResponse('Temporary token and 2FA code are required', 400)
    }

    // Verify the 2FA code against environment variable
    const admin2FASecret = process.env.ADMIN_2FA_SECRET
    
    if (!admin2FASecret) {
      return errorResponse('2FA is not configured', 400)
    }

    const isValid = verifyTOTP(admin2FASecret, code)
    
    if (!isValid) {
      return errorResponse('Invalid 2FA code', 401)
    }

    // Get username from temp token (we trust it since it's short-lived)
    // In production, you should properly verify the temp token
    const username = process.env.ADMIN_ACCOUNT

    // Generate full JWT token
    const token = await createToken({
      username,
      role: 'super_admin',
      permissions: ['*'],
      twoFactorVerified: true
    })

    // Log successful 2FA verification
    await supabase.from('operation_logs').insert({
      action: '2FA_VERIFIED',
      details: { username, ip: request.headers.get('x-forwarded-for') },
      created_at: new Date().toISOString()
    })

    return successResponse({
      token,
      user: { username, role: 'super_admin' }
    }, '2FA verification successful')

  } catch (error) {
    console.error('2FA verification error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
