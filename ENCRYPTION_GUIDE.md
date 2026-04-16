# OpenDoGo 前端加密 API 通信优化指南

## 📋 优化概述

本次优化为 OpenDoGo 系统添加了端到端加密通信功能，确保用户数据在传输过程中的安全性。

### 主要特性

1. **AES-256 数据加密** - 所有敏感数据使用 AES-256 算法加密传输
2. **HMAC-SHA256 签名验证** - 防止请求被篡改
3. **时间戳验证** - 防止重放攻击（5 分钟有效期）
4. **双向加密** - 请求和响应都经过加密处理

## 🔧 技术架构

### 前端加密流程

```
用户输入 → AES 加密 → HMAC 签名 → 发送请求
                                ↓
接收加密响应 → AES 解密 → 显示数据
```

### 后端解密流程

```
接收请求 → 验证时间戳 → 验证签名 → AES 解密 → 业务逻辑
                                              ↓
准备响应 → AES 加密 → 返回加密数据
```

## 📁 文件结构

```
/workspace
├── api/
│   ├── lib/
│   │   ├── encryption.js    # 服务端加密工具（AES + HMAC）
│   │   ├── crypto.js        # 客户端加密工具（Web Crypto API）
│   │   ├── supabase.js      # Supabase 客户端
│   │   └── totp.js          # TOTP 验证
│   └── user/
│       ├── login.js         # 登录 API（已加密）
│       ├── register.js      # 注册 API（已加密）
│       └── profile.js       # 用户信息 API（已加密）
├── ens.html                 # 用户登录注册页面（已集成加密）
├── package.json             # 依赖配置（新增 crypto-js）
└── ENCRYPTION_GUIDE.md      # 本指南
```

## 🔑 环境配置

需要在 `.env` 文件中配置以下环境变量：

```bash
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# 加密密钥（生产环境请使用强随机密钥）
ENCRYPTION_KEY=your-secret-encryption-key-min-32-chars

# 管理员配置（如需要）
ADMIN_ACCOUNT=admin
ADMIN_PASSWORD=secure_password
ADMIN_2FA_SECRET=totp_secret
```

## 💻 使用方法

### 前端示例（ens.html）

```javascript
// 引入 CryptoJS
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>

// 加密函数
function encryptData(data) {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}

// 解密函数
function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const jsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
}

// 生成签名
function generateSignature(payload, timestamp) {
    const dataToSign = JSON.stringify(payload) + timestamp;
    return CryptoJS.HmacSHA256(dataToSign, ENCRYPTION_KEY)
        .toString(CryptoJS.enc.Hex);
}

// 发送加密请求
async function sendEncryptedRequest(endpoint, data) {
    const timestamp = Date.now().toString();
    const signature = generateSignature(data, timestamp);
    const encryptedData = encryptData(data);
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Timestamp': timestamp,
            'X-Signature': signature
        },
        body: JSON.stringify({ encrypted: encryptedData })
    });
    
    const responseData = await response.json();
    return decryptData(responseData.encrypted);
}
```

### 后端示例（API Handler）

```javascript
import { supabase, encryptData, decryptData, verifySignature } from '../lib/encryption.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Timestamp, X-Signature');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    
    // 验证时间戳（防止重放攻击）
    if (timestamp) {
      const now = Date.now();
      const timeDiff = Math.abs(now - parseInt(timestamp));
      if (timeDiff > 5 * 60 * 1000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Request timestamp expired' 
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
    
    // 解密请求体
    let requestData = req.body;
    if (req.body.encrypted) {
      const decrypted = decryptData(req.body.encrypted);
      if (!decrypted) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to decrypt request' 
        });
      }
      requestData = decrypted;
    }
    
    // 业务逻辑处理
    const { email, password } = requestData;
    // ... 处理登录/注册等逻辑
    
    // 准备响应并加密
    const responseData = { success: true, /* ... */ };
    const encryptedResponse = encryptData(responseData);
    
    return res.status(200).json({
      encrypted: encryptedResponse,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
```

## 🔒 安全特性说明

### 1. AES-256 加密
- 使用 CryptoJS 的 AES 算法
- 密钥长度：256 位
- 模式：CBC（CryptoJS 默认）

### 2. HMAC-SHA256 签名
- 防止请求被篡改
- 结合时间戳生成唯一签名
- 服务端验证签名有效性

### 3. 时间戳验证
- 每个请求包含时间戳
- 允许 5 分钟误差窗口
- 有效防止重放攻击

### 4. CORS 配置
- 允许跨域请求
- 自定义头部支持
- 预检请求处理

## 📦 依赖安装

```bash
npm install crypto-js@^4.2.0
```

或更新 `package.json`：

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "otpauth": "^9.2.0",
    "crypto-js": "^4.2.0"
  }
}
```

## ⚠️ 注意事项

1. **密钥管理**
   - 生产环境必须使用强随机密钥
   - 密钥长度建议至少 32 字符
   - 定期轮换密钥
   - 不要将密钥硬编码在前端代码中

2. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 防止中间人攻击
   - 加密不能替代传输层安全

3. **性能考虑**
   - 加密/解密会增加少量延迟
   - 对于大量数据传输，考虑分块处理
   - 监控服务器 CPU 使用率

4. **错误处理**
   - 解密失败时返回友好错误
   - 记录安全相关日志
   - 不暴露敏感错误信息

## 🚀 下一步优化建议

1. **密钥交换** - 实现 RSA 或 ECDH 密钥交换协议
2. **令牌刷新** - 实现自动令牌刷新机制
3. **速率限制** - 添加 API 请求速率限制
4. **审计日志** - 记录所有安全相关操作
5. **双因素认证** - 为用户启用 2FA

## 📞 技术支持

如有问题或建议，请联系开发团队。
