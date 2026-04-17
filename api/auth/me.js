import { verifyToken, parseAuthHeader } from '../../lib/auth.js'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const token = parseAuthHeader(request.headers.get('Authorization'))
    
    if (!token) {
      return errorResponse('Unauthorized', 401)
    }

    const result = await verifyToken(token)
    
    if (!result.valid) {
      return errorResponse('Invalid or expired token', 401)
    }

    return successResponse({
      user: result.payload
    })

  } catch (error) {
    console.error('Get me error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, OPTIONS }
