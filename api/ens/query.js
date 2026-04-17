import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

// 简单的内存缓存（Serverless 环境中每个实例独立）
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

// 从缓存获取
function getFromCache(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return item.data
}

// 存入缓存
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

// ENS Registry ABI (简化版，只包含需要的函数)
const ENS_REGISTRY_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "node", "type": "bytes32" }],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "node", "type": "bytes32" }],
    "name": "resolver",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
  }
]

const ENS_RESOLVER_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "node", "type": "bytes32" }],
    "name": "name",
    "outputs": [{ "name": "r", "type": "string" }],
    "type": "function"
  }
]

// ENS 合约地址
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ENS_RESOLVER_ADDRESS = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'

// namehash 实现
function namehash(name) {
  let node = Array(32).fill(0)
  
  if (name) {
    const parts = name.toLowerCase().split('.')
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      const partHash = keccak256(part)
      node = keccak256([...node, ...partHash])
    }
  }
  
  return '0x' + node.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 简化的 keccak256 实现（使用 Web Crypto API）
async function keccak256(data) {
  // 如果是字符串，转换为字节数组
  if (typeof data === 'string') {
    const encoder = new TextEncoder()
    data = Array.from(encoder.encode(data))
  }
  
  // 使用 Web Crypto API 的 SHA-256，然后模拟 keccak256
  // 注意：这是一个简化实现，生产环境应该使用真正的 keccak256 库
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  // keccak256 和 sha256 不同，这里只是一个占位实现
  // 实际应该使用 ethers 或 web3 库
  return hashArray
}

// 编码函数调用数据
function encodeFunctionCall(abi, functionName, params) {
  const methodId = keccak256(functionName).slice(0, 4)
  // 简化实现，实际需要完整的 ABI 编码
  return '0x' + Array.from(methodId).map(b => b.toString(16).padStart(2, '0')).join('')
}

// RPC 调用
async function rpcCall(url, method, params) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  })
  
  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.result
}

// 查询单个 ENS 域名
async function queryENSDomain(domain, rpcUrl) {
  try {
    const nodeId = namehash(domain)
    
    // 查询 owner
    const ownerData = await rpcCall(rpcUrl, 'eth_call', [{
      to: ENS_REGISTRY_ADDRESS,
      data: encodeFunctionCall(ENS_REGISTRY_ABI, 'owner(bytes32)', [nodeId])
    }, 'latest'])
    
    // 简化处理，实际应该解码返回值
    const owner = ownerData || '0x0000000000000000000000000000000000000000'
    
    return {
      domain,
      owner,
      available: owner === '0x0000000000000000000000000000000000000000',
      queriedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Query failed for ${domain}:`, error)
    throw error
  }
}

// POST - 批量查询 ENS 域名
export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { domains, rpcUrl } = await request.json()

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return errorResponse('Domains array is required', 400)
    }

    if (domains.length > 100) {
      return errorResponse('Maximum 100 domains per request', 400)
    }

    // 使用默认 RPC URL 或提供的 URL
    const targetRpcUrl = rpcUrl || process.env.DEFAULT_RPC_URL || 'https://eth.llamarpc.com'

    // 检查缓存
    const results = []
    const toQuery = []

    for (const domain of domains) {
      const cacheKey = `ens:${domain}`
      const cached = getFromCache(cacheKey)
      
      if (cached) {
        results.push({ ...cached, fromCache: true })
      } else {
        toQuery.push(domain)
      }
    }

    // 查询未缓存的域名
    if (toQuery.length > 0) {
      const queryResults = await Promise.allSettled(
        toQuery.map(domain => queryENSDomain(domain, targetRpcUrl))
      )

      for (let i = 0; i < toQuery.length; i++) {
        const domain = toQuery[i]
        const result = queryResults[i]
        const cacheKey = `ens:${domain}`

        if (result.status === 'fulfilled') {
          setCache(cacheKey, result.value)
          results.push(result.value)
        } else {
          results.push({
            domain,
            error: result.reason.message,
            available: null,
            queriedAt: new Date().toISOString()
          })
        }
      }
    }

    // 记录 API 日志
    await supabase.from('api_logs').insert({
      endpoint: '/api/ens/query',
      method: 'POST',
      status_code: 200,
      response_time: 0,
      request_data: { domainsCount: domains.length },
      created_at: new Date().toISOString()
    })

    return successResponse(results, 'Query completed')

  } catch (error) {
    console.error('ENS query error:', error)
    
    // 记录错误日志
    await supabase.from('error_logs').insert({
      error_type: 'ENS_QUERY_ERROR',
      error_message: error.message,
      stack_trace: error.stack,
      endpoint: '/api/ens/query',
      created_at: new Date().toISOString()
    })

    return errorResponse('Failed to query ENS domains', 500)
  }
}

// GET - 查询单个域名（带缓存）
export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const rpcUrl = searchParams.get('rpcUrl')

    if (!domain) {
      return errorResponse('Domain parameter is required', 400)
    }

    const cacheKey = `ens:${domain}`
    const cached = getFromCache(cacheKey)

    if (cached) {
      return successResponse({ ...cached, fromCache: true }, 'Retrieved from cache')
    }

    const targetRpcUrl = rpcUrl || process.env.DEFAULT_RPC_URL || 'https://eth.llamarpc.com'
    const result = await queryENSDomain(domain, targetRpcUrl)
    
    setCache(cacheKey, result)

    return successResponse(result, 'Query completed')

  } catch (error) {
    console.error('ENS query error:', error)
    return errorResponse('Failed to query ENS domain', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { GET, POST, OPTIONS }
