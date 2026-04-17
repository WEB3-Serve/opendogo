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
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status')

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (status !== null) {
      query = query.eq('status', status === 'true')
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Get users error:', error)
      return errorResponse('Failed to fetch users', 500)
    }

    return successResponse({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, OPTIONS }
