import { supabase, encryptData, decryptData, verifySignature } from '../lib/encryption.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Timestamp, X-Signature');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    
    // 验证时间戳（防止重放攻击，允许 5 分钟误差）
    if (timestamp) {
      const now = Date.now();
      const timeDiff = Math.abs(now - parseInt(timestamp));
      if (timeDiff > 5 * 60 * 1000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Request timestamp expired or invalid' 
        });
      }
      
      // 验证签名
      if (signature && !verifySignature(req.body, timestamp, signature)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid signature' 
        });
      }
    }
    
    // 解密请求体（如果数据是加密的）
    let requestData = req.body;
    if (req.body.encrypted) {
      const decrypted = decryptData(req.body.encrypted);
      if (!decrypted) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to decrypt request data' 
        });
      }
      requestData = decrypted;
    }
    
    const { email, password } = requestData;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    // 准备响应数据
    const responseData = {
      success: true,
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresIn: data.session?.expires_in,
    };

    // 加密响应数据
    const encryptedResponse = encryptData(responseData);
    
    return res.status(200).json({
      encrypted: encryptedResponse,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
