import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse } from '../../lib/response.js'

// ==================== CARD MANAGERS API ====================
// Card managers have limited permissions: only generate cards

async function handleCheck(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.substring(7)
    
    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData?.user) {
      return errorResponse('Invalid or expired token', 401)
    }

    const userId = userData.user.id
    
    // Check if user is a card manager
    const { data: manager, error: managerError } = await supabase
      .from('card_managers')
      .select('id, email, status, allowed_actions')
      .eq('id', userId)
      .single()

    if (managerError || !manager) {
      return successResponse({ 
        isManager: false,
        message: 'User is not a card manager'
      })
    }

    if (!manager.status) {
      return successResponse({ 
        isManager: false,
        message: 'Card manager account is disabled'
      })
    }

    return successResponse({ 
      isManager: true,
      email: manager.email,
      allowedActions: manager.allowed_actions
    })
  } catch (error) {
    console.error('Check card manager error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleGenerate(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.substring(7)
    
    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData?.user) {
      return errorResponse('Invalid or expired token', 401)
    }

    const userId = userData.user.id
    
    // Check if user is admin or card manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    
    if (!isAdmin) {
      // Check if user is card manager
      const { data: manager } = await supabase
        .from('card_managers')
        .select('status, allowed_actions')
        .eq('id', userId)
        .single()

      if (!manager || !manager.status) {
        return errorResponse('Unauthorized: Not a card manager', 403)
      }

      if (!manager.allowed_actions?.generate) {
        return errorResponse('Unauthorized: No permission to generate cards', 403)
      }
    }

    // Parse request body
    const body = await request.json()
    const { count = 1, rule_id, group_id, expires_at, max_uses = 1 } = body

    if (count < 1 || count > 100) {
      return errorResponse('Count must be between 1 and 100', 400)
    }

    // Generate cards
    const cards = []
    const batchId = `batch_${Date.now()}_${userId.substring(0, 8)}`
    
    for (let i = 0; i < count; i++) {
      const cardKey = `ck_${crypto.randomUUID().replace(/-/g, '').substring(0, 32)}`
      
      cards.push({
        card_key: cardKey,
        rule_id: rule_id || null,
        group_id: group_id || null,
        status: 'active',
        expires_at: expires_at || null,
        max_uses: max_uses,
        current_uses: 0,
        batch_id: batchId,
        created_at: new Date().toISOString()
      })
    }

    // Insert cards into database
    const { data: insertedCards, error: insertError } = await supabase
      .from('card_keys')
      .insert(cards)
      .select()

    if (insertError) {
      console.error('Generate cards error:', insertError)
      return errorResponse(`Failed to generate cards: ${insertError.message}`, 400)
    }

    // Get rule names for display
    const ruleIds = [...new Set(insertedCards.filter(c => c.rule_id).map(c => c.rule_id))]
    let rulesMap = {}
    
    if (ruleIds.length > 0) {
      const { data: rules } = await supabase
        .from('card_rules')
        .select('id, name')
        .in('id', ruleIds)
      
      rulesMap = Object.fromEntries(rules?.map(r => [r.id, r.name]) || [])
    }

    // Add rule names to response
    const cardsWithRules = insertedCards.map(card => ({
      ...card,
      rule_name: card.rule_id ? rulesMap[card.rule_id] : null
    }))

    // Log the operation
    await supabase.from('operation_logs').insert({
      user_id: userId,
      action: 'CARD_GENERATE',
      resource: 'card_keys',
      details: { 
        count: insertedCards.length, 
        batch_id: batchId,
        rule_id,
        group_id 
      },
      created_at: new Date().toISOString()
    })

    return successResponse({ 
      cards: cardsWithRules, 
      count: cardsWithRules.length,
      batch_id: batchId
    }, `Successfully generated ${cardsWithRules.length} card(s)`)
  } catch (error) {
    console.error('Generate cards error:', error)
    return errorResponse('Internal server error', 500)
  }
}

async function handleStats(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.substring(7)
    
    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData?.user) {
      return errorResponse('Invalid or expired token', 401)
    }

    const userId = userData.user.id
    
    // Check permissions (admin or card manager)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    
    if (!isAdmin) {
      const { data: manager } = await supabase
        .from('card_managers')
        .select('status')
        .eq('id', userId)
        .single()

      if (!manager || !manager.status) {
        return errorResponse('Unauthorized', 403)
      }
    }

    // Get query parameters
    const url = new URL(request.url)
    const since = url.searchParams.get('since')
    
    // Build query for today's cards
    let todayQuery = supabase
      .from('card_keys')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id.like', `%${userId.substring(0, 8)}%`)
    
    if (since) {
      todayQuery = todayQuery.gte('created_at', since)
    } else {
      // Default to today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      todayQuery = todayQuery.gte('created_at', today.toISOString())
    }

    const { count: todayCount } = await todayQuery

    // Get total count
    const { count: totalCount } = await supabase
      .from('card_keys')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id.like', `%${userId.substring(0, 8)}%`)

    return successResponse({
      today: todayCount || 0,
      total: totalCount || 0
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.split('/').pop()

  switch (path) {
    case 'generate':
      return handleGenerate(request)
    default:
      return errorResponse('Not found', 404)
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.split('/').pop()

  switch (path) {
    case 'check':
      return handleCheck(request)
    case 'stats':
      return handleStats(request)
    default:
      return errorResponse('Not found', 404)
  }
}

export async function OPTIONS(request) {
  return successResponse({}, '', 204)
}
