import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const status = url.searchParams.get('status')

    let query = supabase
      .from('card_keys')
      .select('*, card_rules(name), card_groups(name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status !== null) {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Get cards error:', error)
      return errorResponse('Failed to fetch cards', 500)
    }

    return successResponse({
      cards: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get cards error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, OPTIONS }
