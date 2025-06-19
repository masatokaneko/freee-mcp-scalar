# Freee API セキュリティベストプラクティス

## 概要
Freee APIを安全に使用するための包括的なセキュリティガイドラインです。

## 認証・認可のセキュリティ

### 1. OAuth 2.0実装のベストプラクティス

**必須実装:**
- ✅ **HTTPS通信のみ** - すべての通信で暗号化を使用
- ✅ **stateパラメータ** - CSRF攻撃防止のための必須実装
- ✅ **短期間の認可コード** - 10分以内の有効期限設定
- ✅ **リダイレクトURI検証** - 事前登録されたURIのみ許可

**stateパラメータ実装例:**
```javascript
// 暗号学的に安全なランダム文字列生成
const state = crypto.randomBytes(32).toString('hex');
session.oauthState = state;

// 認証URL生成
const authUrl = `https://accounts.secure.freee.co.jp/public_api/authorize?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${redirectUri}&` +
  `state=${state}`;
```

### 2. トークン管理のセキュリティ

**アクセストークン:**
- 🔒 **メモリまたは暗号化ストレージに保存**
- ⏰ **6時間の有効期限を遵守**
- 🚫 **ログに出力しない**
- 🔄 **自動ローテーション実装**

**リフレッシュトークン:**
- 🔐 **暗号化してデータベースに保存**
- 📅 **90日の有効期限管理**
- 🔄 **使用後の即座な更新**
- 🗑️ **不要時の適切な削除**

**トークン暗号化例:**
```javascript
const crypto = require('crypto');

class TokenEncryption {
  constructor(secretKey) {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = crypto.scryptSync(secretKey, 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## API呼び出しのセキュリティ

### 1. リクエスト検証

**入力検証:**
```javascript
const validateApiParams = (params) => {
  const schema = {
    company_id: { type: 'number', required: true },
    start_date: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    end_date: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ }
  };
  
  // バリデーション実装
  return validateSchema(params, schema);
};
```

**SQLインジェクション対策:**
```python
# 悪い例
query = f"SELECT * FROM transactions WHERE company_id = {company_id}"

# 良い例  
query = "SELECT * FROM transactions WHERE company_id = %s"
cursor.execute(query, (company_id,))
```

### 2. レート制限対策

**指数バックオフ実装:**
```javascript
class RateLimitedApiClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseDelay = 1000; // 1秒
    this.maxRetries = 5;
  }

  async makeRequest(url, options, retryCount = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...options.headers
        }
      });

      if (response.status === 429) { // Too Many Requests
        if (retryCount >= this.maxRetries) {
          throw new Error('Rate limit exceeded');
        }

        const delay = this.baseDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.makeRequest(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}
```

## データ保護

### 1. 機密データの処理

**ログ出力時の注意:**
```javascript
// 悪い例 - トークンがログに出力される
console.log('API Response:', response);

// 良い例 - 機密データを除外
const safeResponse = {
  ...response,
  access_token: '[REDACTED]',
  refresh_token: '[REDACTED]'
};
console.log('API Response:', safeResponse);
```

**メモリクリア:**
```javascript
class SecureTokenManager {
  constructor() {
    this.tokens = new Map();
  }

  setToken(userId, token) {
    this.tokens.set(userId, token);
  }

  clearToken(userId) {
    const token = this.tokens.get(userId);
    if (token && typeof token === 'string') {
      // メモリ上の文字列を上書き
      for (let i = 0; i < token.length; i++) {
        token[i] = '0';
      }
    }
    this.tokens.delete(userId);
  }
}
```

### 2. 暗号化通信

**TLS設定の強化:**
```javascript
const https = require('https');

const secureAgent = new https.Agent({
  secureProtocol: 'TLSv1_2_method',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true
});
```

## エラーハンドリングのセキュリティ

### 1. 情報漏洩防止

**安全なエラーレスポンス:**
```javascript
const handleApiError = (error, res) => {
  // 詳細なエラーをログに記録（サーバーサイドのみ）
  logger.error('API Error:', {
    message: error.message,
    stack: error.stack,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // クライアントには最小限の情報のみ返す
  if (error.response?.status === 401) {
    return res.status(401).json({ 
      error: 'authentication_required',
      message: 'Please re-authenticate' 
    });
  }

  // その他のエラーは汎用メッセージ
  return res.status(500).json({ 
    error: 'internal_error',
    message: 'An error occurred. Please try again later.' 
  });
};
```

### 2. ログの安全な管理

**構造化ログ実装:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(info => {
      // 機密データをフィルタリング
      const sanitized = sanitizeLogData(info);
      return JSON.stringify(sanitized);
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const sanitizeLogData = (data) => {
  const sensitive = ['password', 'token', 'secret', 'key', 'authorization'];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const redactSensitive = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && 
          sensitive.some(word => key.toLowerCase().includes(word))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactSensitive(obj[key]);
      }
    }
  };
  
  redactSensitive(sanitized);
  return sanitized;
};
```

## 監査とモニタリング

### 1. アクセスログ

**包括的なログ記録:**
```javascript
const auditLogger = {
  logApiAccess: (userId, endpoint, method, statusCode, duration) => {
    logger.info('API_ACCESS', {
      userId,
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
  },

  logAuthEvent: (userId, event, success, details = {}) => {
    logger.info('AUTH_EVENT', {
      userId,
      event, // 'login', 'logout', 'token_refresh', 'token_revoke'
      success,
      details: sanitizeLogData(details),
      timestamp: new Date().toISOString()
    });
  }
};
```

### 2. 異常検知

**不審なアクティビティの検知:**
```javascript
class SecurityMonitor {
  constructor() {
    this.failedAttempts = new Map();
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15分
  }

  checkFailedAttempts(userId) {
    const attempts = this.failedAttempts.get(userId);
    if (!attempts) return false;

    // ロックアウト期間チェック
    if (Date.now() - attempts.lastAttempt < this.lockoutDuration) {
      return attempts.count >= this.maxFailedAttempts;
    }

    // ロックアウト期間が過ぎていればリセット
    this.failedAttempts.delete(userId);
    return false;
  }

  recordFailedAttempt(userId) {
    const attempts = this.failedAttempts.get(userId) || { count: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(userId, attempts);

    if (attempts.count >= this.maxFailedAttempts) {
      // アラート送信
      this.sendSecurityAlert(userId, 'ACCOUNT_LOCKOUT');
    }
  }

  sendSecurityAlert(userId, alertType) {
    logger.warn('SECURITY_ALERT', {
      userId,
      alertType,
      timestamp: new Date().toISOString()
    });
    
    // 管理者への通知実装
  }
}
```

## 本番環境での追加考慮事項

### 1. 環境変数管理

```bash
# .env.production
FREEE_CLIENT_ID=prod_client_id
FREEE_CLIENT_SECRET=prod_client_secret
ENCRYPTION_KEY=strong_encryption_key_here
JWT_SECRET=jwt_secret_key_here
DATABASE_URL=encrypted_database_url
LOG_LEVEL=warn
```

### 2. インフラストラクチャセキュリティ

**必須実装:**
- 🔒 WAF (Web Application Firewall)
- 🚪 API Gateway with rate limiting
- 📊 Real-time monitoring and alerting
- 🔐 Secrets management (AWS Secrets Manager, Azure Key Vault等)
- 🛡️ Network segmentation
- 📋 Regular security audits

### 3. コンプライアンス

**データ保護規制への対応:**
- 📋 GDPR/CCPA compliance
- 🗑️ Right to erasure implementation
- 📊 Data processing audit trails
- 🔒 Data encryption at rest and in transit
- 👥 Access control and role-based permissions

## セキュリティチェックリスト

**開発段階:**
- [ ] OAuth 2.0 PKCE実装（SPAの場合）
- [ ] stateパラメータによるCSRF保護
- [ ] 入力検証とサニタイゼーション
- [ ] SQLインジェクション対策
- [ ] XSS攻撃対策
- [ ] 暗号化通信（HTTPS）

**デプロイ段階:**
- [ ] シークレット管理システム使用
- [ ] 環境変数の適切な設定
- [ ] ログ設定とモニタリング
- [ ] セキュリティヘッダーの設定
- [ ] CORS設定の確認

**運用段階:**
- [ ] 定期的なセキュリティ監査
- [ ] 依存関係の脆弱性スキャン
- [ ] アクセスログの監視
- [ ] インシデント対応計画
- [ ] バックアップと復旧手順