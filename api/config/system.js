import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Get system config error:', error)
      return errorResponse('Failed to fetch system config', 500)
    }

    return successResponse(data || {})

  } catch (error) {
    console.error('Get system config error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    
    const { data: current } = await supabase
      .from('system_config')
      .select('id')
      .single()

    let result
    
    if (current) {
      const { data, error } = await supabase
        .from('system_config')
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
      const { data, error } = await supabase
        .from('system_config')
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

    return successResponse(result, 'System config saved successfully')

  } catch (error) {
    console.error('Save system config error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, PUT, OPTIONS }
