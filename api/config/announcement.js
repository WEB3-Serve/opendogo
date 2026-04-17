import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const published = url.searchParams.get('published')

    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (published === 'true') {
      query = query
        .eq('published', true)
        .lte('publish_at', new Date().toISOString())
        .or(`expire_at.is.null,gte.expire_at.${new Date().toISOString()}`)
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      console.error('Get announcements error:', error)
      return errorResponse('Failed to fetch announcements', 500)
    }

    return successResponse(data)

  } catch (error) {
    console.error('Get announcements error:', error)
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
      title, 
      content, 
      type = 'info', 
      published = false,
      publish_at,
      expire_at
    } = body

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        type,
        published,
        publish_at: publish_at || new Date().toISOString(),
        expire_at,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Create announcement error:', error)
      return errorResponse(`Failed to create announcement: ${error.message}`, 400)
    }

    return successResponse(data, 'Announcement created successfully')

  } catch (error) {
    console.error('Create announcement error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, POST, OPTIONS }
