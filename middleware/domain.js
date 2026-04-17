import { errorResponse, handleOptions } from './response.js'

// 从环境变量获取允许的域名列表
function getAllowedDomains() {
  const domains = process.env.ALLOWED_DOMAINS || ''
  if (!domains.trim()) return []
  return domains.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
}

// 检查请求来源是否合法
function isAllowedDomain(request) {
  const allowedDomains = getAllowedDomains()
  
  // 如果没有配置允许的域名，则允许所有（开发模式）
  if (allowedDomains.length === 0) {
    return true
  }

  const url = new URL(request.url)
  const requestHost = url.hostname.toLowerCase()
  
  // 检查 Host 头
  if (allowedDomains.includes(requestHost)) {
    return true
  }

  // 检查 Referer 头
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (allowedDomains.includes(refererUrl.hostname.toLowerCase())) {
        return true
      }
    } catch (e) {
      // Invalid referer, ignore
    }
  }

  // 检查 Origin 头
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (allowedDomains.includes(originUrl.hostname.toLowerCase())) {
        return true
      }
    } catch (e) {
      // Invalid origin, ignore
    }
  }

  return false
}

// 获取重定向目标URL
function getRedirectUrl() {
  return process.env.UNAUTHORIZED_REDIRECT_URL || 'https://example.com/unauthorized'
}

// 域名授权中间件
export async function domainMiddleware(request) {
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  // 某些路径跳过域名检查（如静态资源、健康检查等）
  const url = new URL(request.url)
  const skipPaths = ['/api/health', '/api/status']
  
  if (skipPaths.some(p => url.pathname.startsWith(p))) {
    return null
  }

  // 检查域名授权
  if (!isAllowedDomain(request)) {
    const requestHost = url.hostname
    
    // 记录未授权的访问尝试
    console.warn(`[Domain Auth] Unauthorized access attempt from: ${requestHost}`)
    
    // 对于 API 请求，返回错误
    if (url.pathname.startsWith('/api/')) {
      return errorResponse('Unauthorized domain access', 403, {
        code: 'DOMAIN_NOT_AUTHORIZED',
        message: 'This domain is not authorized to use this service'
      })
    }
    
    // 对于前端页面请求，返回重定向 HTML
    const redirectUrl = getRedirectUrl()
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>未授权访问</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .icon {
            font-size: 80px;
            color: #dc2626;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .info-box {
            background: #f3f4f6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .info-box code {
            background: #e5e7eb;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 14px;
            color: #dc2626;
            word-break: break-all;
          }
          .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
          }
          .btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37,99,235,0.3);
          }
          .redirect-hint {
            margin-top: 20px;
            font-size: 14px;
            color: #9ca3af;
          }
        </style>
        <meta http-equiv="refresh" content="3;url=${redirectUrl}">
      </head>
      <body>
        <div class="container">
          <div class="icon">🚫</div>
          <h1>未授权访问</h1>
          <p>此域名未被授权访问该系统。如果您是该系统的合法使用者，请联系管理员配置域名白名单。</p>
          <div class="info-box">
            <p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">当前访问域名：</p>
            <code>${requestHost}</code>
          </div>
          <a href="${redirectUrl}" class="btn">返回授权页面</a>
          <p class="redirect-hint">3 秒后自动跳转...</p>
        </div>
      </body>
      </html>
    `
    
    return new Response(html, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Domain-Auth': 'failed'
      }
    })
  }

  // 授权通过
  return null
}

// 辅助函数：验证单个域名
export function validateDomain(domain) {
  const allowedDomains = getAllowedDomains()
  return allowedDomains.length === 0 || allowedDomains.includes(domain.toLowerCase())
}

// 辅助函数：获取当前配置的域名列表
export function getConfiguredDomains() {
  return getAllowedDomains()
}

export default domainMiddleware
