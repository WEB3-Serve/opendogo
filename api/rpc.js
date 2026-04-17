// ============================================
// ENS Manager - ENS 查询核心 API
// 所有 ENS 查询逻辑都在服务器端执行
// 前端只负责发请求和渲染结果
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ensName, userId, username } = req.body

    if (!ensName) {
      return res.status(400).json({ error: 'ENS name required' })
    }

    // 记录开始时间
    const startTime = Date.now()

    // 获取可用的 RPC 节点
    const nodes = await getActiveRpcNodes()
    
    if (!nodes || nodes.length === 0) {
      return res.status(503).json({ error: 'No available RPC nodes' })
    }

    // 选择最优节点 (按优先级和权重)
    const selectedNode = selectBestNode(nodes)

    // 执行 ENS 解析
    const result = await resolveEnsName(ensName, selectedNode)

    // 计算响应时间
    const responseTime = Date.now() - startTime

    // 记录查询日志
    await logQuery({
      user_id: userId || null,
      username: username || null,
      ens_name: ensName,
      result: result,
      rpc_node_id: selectedNode.id,
      rpc_node_name: selectedNode.name,
      response_time: responseTime,
      status: result.error ? 'failed' : 'success',
      error_message: result.error || null,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    // 更新节点统计
    await updateNodeStats(selectedNode.id, responseTime, !result.error)

    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        node: selectedNode.name,
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('RPC error:', error)
    return res.status(500).json({ 
      error: 'ENS query failed',
      message: error.message 
    })
  }
}

// 获取活跃的 RPC 节点
async function getActiveRpcNodes() {
  const { data, error } = await supabase
    .from('rpc_nodes')
    .select('*')
    .eq('is_active', true)
    .in('health_status', ['healthy', 'unknown'])
    .order('priority', { ascending: true })
    .order('weight', { ascending: false })
  
  if (error) throw error
  return data
}

// 选择最佳节点
function selectBestNode(nodes) {
  // 简单实现：返回第一个节点
  // 可以扩展为加权随机、轮询等策略
  return nodes[0]
}

// 解析 ENS 域名
async function resolveEnsName(ensName, node) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(node.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // ENS Registry
          data: '0x...' // 实际需要根据 ENS 规范构造调用数据
        }, 'latest']
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      return { error: data.error.message }
    }

    // 简化示例，实际需要完整实现 ENS 解析逻辑
    return {
      address: data.result || null,
      resolvedAt: new Date().toISOString()
    }

  } catch (error) {
    return { error: error.message }
  }
}

// 记录查询日志
async function logQuery(logData) {
  try {
    await supabase.from('query_logs').insert([logData])
  } catch (error) {
    console.error('Failed to log query:', error)
  }
}

// 更新节点统计
async function updateNodeStats(nodeId, responseTime, success) {
  try {
    const { data: node } = await supabase
      .from('rpc_nodes')
      .select('total_requests, failed_requests, avg_response_time')
      .eq('id', nodeId)
      .single()

    if (!node) return

    const newTotal = (node.total_requests || 0) + 1
    const newFailed = (node.failed_requests || 0) + (success ? 0 : 1)
    const newAvg = Math.round(
      ((node.avg_response_time || 0) * (newTotal - 1) + responseTime) / newTotal
    )

    await supabase
      .from('rpc_nodes')
      .update({
        total_requests: newTotal,
        failed_requests: newFailed,
        avg_response_time: newAvg,
        last_health_check: new Date().toISOString(),
        health_status: success ? 'healthy' : 'degraded'
      })
      .eq('id', nodeId)
  } catch (error) {
    console.error('Failed to update node stats:', error)
  }
}
