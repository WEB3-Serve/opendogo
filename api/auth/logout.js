import { successResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  // In a stateless API, logout is handled client-side by removing the token
  // This endpoint is for logging the logout action
  
  return successResponse({}, 'Logout successful')
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
