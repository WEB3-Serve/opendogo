import { supabase } from '../lib/encryption.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }

    // 使用 Supabase 发送确认邮件（包含验证码）
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: '验证码已发送到您的邮箱，请查收（有效期 10 分钟）' 
    });

  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
