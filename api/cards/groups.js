import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

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

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

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

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, POST, OPTIONS }
