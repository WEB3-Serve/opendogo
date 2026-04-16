import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Sign up with Supabase (includes email verification)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Check if user needs to confirm email
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already registered' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
