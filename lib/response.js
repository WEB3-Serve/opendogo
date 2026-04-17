export function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, PATCH, DELETE, POST, PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

export function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  })
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...extraHeaders
    }
  })
}

export function errorResponse(message, status = 400, details = null) {
  return jsonResponse({
    success: false,
    error: message,
    details
  }, status)
}

export function successResponse(data, message = 'Success') {
  return jsonResponse({
    success: true,
    message,
    data
  })
}

export default { corsHeaders, handleOptions, jsonResponse, errorResponse, successResponse }
