// Cloudflare Workers 主入口文件
import { handleAuthRequest } from './api/auth/index.js'
import { handleCardManagerRequest } from './api/card-managers/index.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // 设置全局环境变量
    globalThis.SUPABASE_URL = env.SUPABASE_URL || ''
    globalThis.SUPABASE_KEY = env.SUPABASE_ANON_KEY || env.SUPABASE_KEY || ''

    // 静态文件服务 - HTML 文件
    if (path.endsWith('.html') || path === '/' || path === '/index.html') {
      // 尝试从 assets 中获取文件
      try {
        const fileName = path === '/' ? 'index.html' : path.substring(1)
        const file = await env.__STATIC_CONTENT.get(fileName)
        if (file) {
          const contentType = getContentType(path)
          return new Response(file, {
            headers: {
              'content-type': contentType,
            },
          })
        }
      } catch (e) {
        console.error('Error serving static file:', e)
      }
      
      // 如果找不到文件，返回 index.html
      if (path !== '/api' && !path.startsWith('/api/')) {
        try {
          const file = await env.__STATIC_CONTENT.get('index.html')
          if (file) {
            return new Response(file, {
              headers: {
                'content-type': 'text/html;charset=UTF-8',
              },
            })
          }
        } catch (e) {
          console.error('Error serving index.html:', e)
        }
      }
    }

    // API 路由处理
    if (path.startsWith('/api/')) {
      // Auth API: /api/auth/*
      if (path.startsWith('/api/auth/')) {
        return handleAuthRequest(request, env)
      }
      
      // Card Manager API: /api/card-managers/*
      if (path.startsWith('/api/card-managers/')) {
        return handleCardManagerRequest(request, env)
      }

      // Users API: /api/users/* - 暂时返回错误
      if (path.startsWith('/api/users/')) {
        return new Response(JSON.stringify({ 
          error: 'This endpoint is not yet implemented',
          message: '验证码功能暂未实现'
        }), {
          status: 501,
          headers: { 'content-type': 'application/json' }
        })
      }

      // 其他 API 路径返回 404
      return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }

    // 默认返回 404
    return new Response('Not found', { status: 404 })
  }
}

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase()
  const types = {
    'html': 'text/html;charset=UTF-8',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  }
  return types[ext] || 'text/plain'
}
