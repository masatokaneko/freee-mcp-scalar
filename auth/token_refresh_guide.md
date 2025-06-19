# リフレッシュトークン管理ガイド

## 概要
Freee APIのリフレッシュトークンは、ユーザーの再認証なしに新しいアクセストークンを取得するために使用します。

## 重要な変更点（2023年12月〜）
- **有効期限**: 無期限 → **90日間**
- **使用制限**: 一度使用すると新しいリフレッシュトークンが発行される

## リフレッシュトークンの使用

### 1. 基本的なリフレッシュ

**cURL例:**
```bash
curl -X POST https://accounts.secure.freee.co.jp/public_api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

**成功レスポンス:**
```json
{
  "access_token": "new_access_token",
  "token_type": "Bearer", 
  "expires_in": 21600,
  "refresh_token": "new_refresh_token",
  "scope": "read write"
}
```

### 2. Node.js実装例

```javascript
const axios = require('axios');

async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  try {
    const response = await axios.post('https://accounts.secure.freee.co.jp/public_api/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // 新しいトークンを保存
    await saveTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000)
    });

    return access_token;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data);
    throw error;
  }
}
```

### 3. Python実装例

```python
import requests
import json
from datetime import datetime, timedelta

def refresh_access_token(refresh_token, client_id, client_secret):
    url = "https://accounts.secure.freee.co.jp/public_api/token"
    
    data = {
        'grant_type': 'refresh_token',
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        response.raise_for_status()
        
        token_data = response.json()
        
        # 新しいトークンを保存
        save_tokens({
            'access_token': token_data['access_token'],
            'refresh_token': token_data['refresh_token'],
            'expires_at': datetime.now() + timedelta(seconds=token_data['expires_in'])
        })
        
        return token_data['access_token']
    
    except requests.exceptions.RequestException as e:
        print(f"Token refresh failed: {e}")
        raise
```

## トークン管理のベストプラクティス

### 1. 自動リフレッシュ機能

```javascript
class FreeeTokenManager {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokens = this.loadTokens();
  }

  async getValidAccessToken() {
    // トークンの有効期限チェック（5分前にリフレッシュ）
    const bufferTime = 5 * 60 * 1000; // 5分
    if (Date.now() + bufferTime >= this.tokens.expiresAt) {
      await this.refreshTokens();
    }
    
    return this.tokens.accessToken;
  }

  async refreshTokens() {
    const newAccessToken = await refreshAccessToken(
      this.tokens.refreshToken,
      this.clientId,
      this.clientSecret
    );
    
    this.tokens = this.loadTokens(); // 新しいトークンを読み込み
    return newAccessToken;
  }

  async makeApiRequest(endpoint, options = {}) {
    const accessToken = await this.getValidAccessToken();
    
    return fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
      }
    });
  }
}
```

### 2. エラーハンドリング

```javascript
async function handleApiRequest(url, options) {
  try {
    const response = await makeApiRequest(url, options);
    
    if (response.status === 401) {
      // アクセストークンが無効、リフレッシュを試行
      await refreshTokens();
      
      // リフレッシュ後に再試行
      const retryResponse = await makeApiRequest(url, options);
      return retryResponse;
    }
    
    return response;
  } catch (error) {
    if (error.message.includes('invalid_grant')) {
      // リフレッシュトークンも無効、再認証が必要
      throw new Error('Re-authentication required');
    }
    throw error;
  }
}
```

## 重要な注意事項

1. **必ず新しいリフレッシュトークンを保存**
   - 使用後は古いトークンが無効化される
   - 新しいトークンの保存に失敗すると認証が失われる

2. **有効期限の管理**
   - リフレッシュトークン: 90日
   - 定期的な使用で期限を延長

3. **セキュリティ**
   - トークンを安全に保存
   - 環境変数や暗号化ストレージを使用

4. **エラー対応**
   - `invalid_grant`: 再認証が必要
   - `invalid_client`: クライアント情報の確認

## トークン失効時の対応

リフレッシュトークンが無効になった場合:
1. ユーザーに再認証を求める
2. OAuth認証フローを最初から実行
3. 新しいアクセス・リフレッシュトークンを取得