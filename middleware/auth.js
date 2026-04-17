import { verifyToken, parseAuthHeader } from '../lib/auth.js'
import { errorResponse, handleOptions } from '../lib/response.js'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/verify-2fa',
  '/api/ens/query',
  '/api/config/site',
  '/api/config/announcements'
]

export async function authMiddleware(request) {
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const path = url.pathname

  // Skip auth for public paths
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return null
  }

  // Parse Authorization header
  const token = parseAuthHeader(request.headers.get('Authorization'))
  
  if (!token) {
    return errorResponse('Unauthorized: Missing token', 401)
  }

  // Verify token
  const result = await verifyToken(token)
  
  if (!result.valid) {
    return errorResponse('Unauthorized: Invalid or expired token', 401)
  }

  // Attach user info to request context
  return { user: result.payload }
}

export default authMiddleware
