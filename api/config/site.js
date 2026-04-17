import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Get site config error:', error)
      return errorResponse('Failed to fetch site config', 500)
    }

    return successResponse(data || {})

  } catch (error) {
    console.error('Get site config error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    
    // Get current config
    const { data: current } = await supabase
      .from('site_config')
      .select('id')
      .single()

    let result
    
    if (current) {
      // Update existing
      const { data, error } = await supabase
        .from('site_config')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('site_config')
        .insert({
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }

    return successResponse(result, 'Site config saved successfully')

  } catch (error) {
    console.error('Save site config error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, PUT, OPTIONS }
