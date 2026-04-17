import { nanoid } from 'nanoid'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const body = await request.json()
    const { 
      count = 1, 
      rule_id, 
      group_id, 
      expires_at, 
      max_uses = 1 
    } = body

    const cards = []
    
    for (let i = 0; i < count; i++) {
      const cardKey = `ck_${nanoid(32)}`
      
      cards.push({
        card_key: cardKey,
        rule_id,
        group_id,
        status: 'active',
        expires_at,
        max_uses,
        current_uses: 0,
        created_at: new Date().toISOString()
      })
    }

    const { data, error } = await supabase
      .from('card_keys')
      .insert(cards)
      .select()

    if (error) {
      console.error('Generate cards error:', error)
      return errorResponse(`Failed to generate cards: ${error.message}`, 400)
    }

    return successResponse({
      cards: data,
      count: data.length
    }, `Successfully generated ${data.length} card(s)`)

  } catch (error) {
    console.error('Generate cards error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
