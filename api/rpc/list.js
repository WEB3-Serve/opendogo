import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { data, error } = await supabase
      .from('rpc_nodes')
      .select('*, rpc_groups(name)')
      .order('priority', { ascending: false })

    if (error) {
      console.error('Get RPC nodes error:', error)
      return errorResponse('Failed to fetch RPC nodes', 500)
    }

    return successResponse(data)

  } catch (error) {
    console.error('Get RPC nodes error:', error)
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
      url, 
      group_id, 
      priority = 0, 
      weight = 1,
      status = true 
    } = body

    const { data, error } = await supabase
      .from('rpc_nodes')
      .insert({
        name,
        url,
        group_id,
        priority,
        weight,
        status,
        health_status: 'unknown',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Create RPC node error:', error)
      return errorResponse(`Failed to create node: ${error.message}`, 400)
    }

    return successResponse(data, 'RPC node created successfully')

  } catch (error) {
    console.error('Create RPC node error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, POST, OPTIONS }
