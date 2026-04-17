import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

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

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    const { 
      name, 
      valid_days = 30, 
      max_queries_per_day = 100, 
      allow_batch = true, 
      max_batch_size = 50 
    } = body

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

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, POST, OPTIONS }
