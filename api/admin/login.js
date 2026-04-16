import { verifyTOTP } from '../lib/totp.js';

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
    const { account, password, totp } = req.body;

    // Step 1: Verify account and password from environment variables
    const adminAccount = process.env.ADMIN_ACCOUNT;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const admin2FASecret = process.env.ADMIN_2FA_SECRET;

    if (!adminAccount || !adminPassword || !admin2FASecret) {
      console.error('Missing admin environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    // Check if account and password match
    if (account !== adminAccount || password !== adminPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid account or password' 
      });
    }

    // If this is step 1 (no TOTP provided yet), return success and ask for TOTP
    if (!totp) {
      return res.status(200).json({
        success: true,
        step: '2fa_required',
        message: 'Please enter your Google Authenticator code',
      });
    }

    // Step 2: Verify TOTP code
    const isValid = verifyTOTP(admin2FASecret, totp);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication code' 
      });
    }

    // Generate admin session token (simple JWT-like token for Vercel serverless)
    const adminToken = Buffer.from(JSON.stringify({
      account: adminAccount,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    })).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token: adminToken,
      account: adminAccount,
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
