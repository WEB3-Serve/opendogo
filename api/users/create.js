import { nanoid } from 'nanoid'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    const { username, email, card_key, group_id, expires_at, status = true } = body

    // Generate card key if not provided
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

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
