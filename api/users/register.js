import { nanoid } from 'nanoid'
import { supabase } from '../../lib/supabase.js'
import { successResponse, errorResponse, handleOptions } from '../../lib/response.js'

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  
  try {
    const body = await request.json()
    const { username, email, password, verify_code } = body

    // Validation
    if (!username || !email || !password || !verify_code) {
      return errorResponse('Username, email, password and verification code are required', 400)
    }

    if (!/^[a-zA-Z0-9]{4,20}$/.test(username)) {
      return errorResponse('Username must be 4-20 alphanumeric characters', 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Invalid email format', 400)
    }

    if (!/^\d{6}$/.test(verify_code)) {
      return errorResponse('Verification code must be 6 digits', 400)
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }

    // Verify the verification code
    const now = new Date().toISOString()
    const { data: verifyData, error: verifyError } = await supabase
      .from('verify_codes')
      .select('id, email, code, expires_at, used')
      .eq('email', email)
      .eq('code', verify_code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verifyData) {
      return errorResponse('Invalid or expired verification code', 400)
    }

    // Mark the verification code as used
    await supabase
      .from('verify_codes')
      .update({ used: true })
      .eq('id', verifyData.id)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .or(`email.eq.${email}`)
      .single()

    if (existingUser) {
      return errorResponse('Username or email already exists', 409)
    }

    // Generate card key
    const cardKey = `ck_${nanoid(32)}`

    // Hash password using PBKDF2
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    const passwordHash = Array.from(new Uint8Array(exportedKey))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const passwordSalt = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: `${passwordSalt}:${passwordHash}`,
        card_key: cardKey,
        group_id: null,
        expires_at: null,
        status: true,
        query_count: 0,
        created_at: new Date().toISOString()
      })
      .select('id, username, email, card_key, created_at')
      .single()

    if (error) {
      console.error('Register error:', error)
      return errorResponse(`Failed to create user: ${error.message}`, 400)
    }

    return successResponse(data, 'User registered successfully')

  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function OPTIONS(request) {
  return handleOptions(request)
}

export default { POST, OPTIONS }
