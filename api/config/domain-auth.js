import { supabase } from '../supabase.js'
import { successResponse, errorResponse } from './response.js'

// 获取所有域名授权配置
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('domain_authorizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return successResponse(data, 'Domain authorizations retrieved successfully')
  } catch (error) {
    console.error('Get domain authorizations error:', error)
    return errorResponse('Failed to get domain authorizations', 500)
  }
}

// 添加新的域名授权
export async function POST(request) {
  try {
    const { domain, description, expires_at, is_active } = await request.json()

    if (!domain) {
      return errorResponse('Domain is required', 400)
    }

    // 验证域名格式
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return errorResponse('Invalid domain format', 400)
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('domain_authorizations')
      .select('id')
      .eq('domain', domain.toLowerCase())
      .single()

    if (existing) {
      return errorResponse('Domain already authorized', 409)
    }

    const { data, error } = await supabase
      .from('domain_authorizations')
      .insert({
        domain: domain.toLowerCase(),
        description: description || '',
        expires_at: expires_at || null,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 记录操作日志
    await supabase.from('operation_logs').insert({
      action: 'DOMAIN_AUTH_ADD',
      details: { domain, description },
      created_at: new Date().toISOString()
    })

    return successResponse(data, 'Domain authorization added successfully')
  } catch (error) {
    console.error('Add domain authorization error:', error)
    return errorResponse('Failed to add domain authorization', 500)
  }
}

// 更新域名授权
export async function PUT(request) {
  try {
    const { id, domain, description, expires_at, is_active } = await request.json()

    if (!id) {
      return errorResponse('ID is required', 400)
    }

    const updateData = {}
    if (domain) {
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
      if (!domainRegex.test(domain)) {
        return errorResponse('Invalid domain format', 400)
      }
      updateData.domain = domain.toLowerCase()
    }
    if (description !== undefined) updateData.description = description
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (is_active !== undefined) updateData.is_active = is_active

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('domain_authorizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录操作日志
    await supabase.from('operation_logs').insert({
      action: 'DOMAIN_AUTH_UPDATE',
      details: { id, ...updateData },
      created_at: new Date().toISOString()
    })

    return successResponse(data, 'Domain authorization updated successfully')
  } catch (error) {
    console.error('Update domain authorization error:', error)
    return errorResponse('Failed to update domain authorization', 500)
  }
}

// 删除域名授权
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID is required', 400)
    }

    // 先获取要删除的记录用于日志
    const { data: record } = await supabase
      .from('domain_authorizations')
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('domain_authorizations')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 记录操作日志
    await supabase.from('operation_logs').insert({
      action: 'DOMAIN_AUTH_DELETE',
      details: { id, domain: record?.domain },
      created_at: new Date().toISOString()
    })

    return successResponse(null, 'Domain authorization deleted successfully')
  } catch (error) {
    console.error('Delete domain authorization error:', error)
    return errorResponse('Failed to delete domain authorization', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}

export default { GET, POST, PUT, DELETE, OPTIONS }
