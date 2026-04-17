import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    // Get overall statistics
    const [usersCount, cardsCount, rpcCount, logsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('card_keys').select('*', { count: 'exact', head: true }),
      supabase.from('rpc_nodes').select('*', { count: 'exact', head: true }),
      supabase.from('api_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // Get RPC health summary
    const rpcHealth = await supabase
      .from('rpc_nodes')
      .select('health_status')
      .eq('status', true)

    const healthyNodes = rpcHealth.data?.filter(n => n.health_status === 'healthy').length || 0
    const totalNodes = rpcHealth.data?.length || 0

    // Get recent activity
    const recentLogins = await supabase
      .from('operation_logs')
      .select('created_at')
      .eq('action', 'LOGIN')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get card usage stats
    const cardStats = await supabase
      .from('card_keys')
      .select('status')
    
    const statusCounts = cardStats.data?.reduce((acc, card) => {
      acc[card.status] = (acc[card.status] || 0) + 1
      return acc
    }, {}) || {}

    return successResponse({
      overview: {
        totalUsers: usersCount.count || 0,
        totalCards: cardsCount.count || 0,
        totalRPCs: rpcCount.count || 0,
        todayApiCalls: logsCount.count || 0
      },
      rpcHealth: {
        healthy: healthyNodes,
        total: totalNodes,
        percentage: totalNodes > 0 ? Math.round((healthyNodes / totalNodes) * 100) : 0
      },
      cardStats: {
        active: statusCounts.active || 0,
        used: statusCounts.used || 0,
        expired: statusCounts.expired || 0,
        frozen: statusCounts.frozen || 0
      },
      recentLogins: recentLogins.data?.map(log => log.created_at) || []
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, OPTIONS }
