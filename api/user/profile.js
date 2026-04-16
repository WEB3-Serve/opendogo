import { supabase, encryptData, decryptData, verifySignature } from '../lib/encryption.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Timestamp, X-Signature');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get user from Supabase session
    const authHeader = req.headers.authorization;
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
      if (signature && !verifySignature({}, timestamp, signature)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid signature' 
        });
      }
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // 准备响应数据
    const responseData = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    };
    
    // 加密响应数据
    const encryptedResponse = encryptData(responseData);
    
    return res.status(200).json({
      encrypted: encryptedResponse,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
