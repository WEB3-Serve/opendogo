import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

async function checkRPCHealth(url, timeout = 5000) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      }),
      signal: controller.signal
    })
    
    clearTimeout(id)
    
    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` }
    }
    
    const data = await response.json()
    if (data.error || !data.result) {
      return { healthy: false, error: data.error?.message || 'No result' }
    }
    
    return { healthy: true, latency: Date.now() }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    const { node_id } = body

    let query = supabase.from('rpc_nodes').select('*')
    
    if (node_id) {
      query = query.eq('id', node_id)
    } else {
      query = query.eq('status', true)
    }

    const { data: nodes, error } = await query

    if (error) {
      console.error('Health check error:', error)
      return errorResponse('Failed to fetch RPC nodes', 500)
    }

    const results = []
    
    for (const node of nodes) {
      const startTime = Date.now()
      const healthResult = await checkRPCHealth(node.url)
      const latency = healthResult.healthy ? Date.now() - startTime : null
      
      // Update node status in database
      await supabase
        .from('rpc_nodes')
        .update({
          health_status: healthResult.healthy ? 'healthy' : 'unhealthy',
          last_health_check: new Date().toISOString(),
          avg_response_time: latency
        })
        .eq('id', node.id)

      results.push({
        id: node.id,
        name: node.name,
        url: node.url,
        healthy: healthResult.healthy,
        latency,
        error: healthResult.error
      })
    }

    return successResponse({
      results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.healthy).length,
        unhealthy: results.filter(r => !r.healthy).length
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
