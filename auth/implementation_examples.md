# Freee API認証 実装例

## 完全な認証フロー実装

### Node.js + Express実装

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// 設定
const config = {
  clientId: process.env.FREEE_CLIENT_ID,
  clientSecret: process.env.FREEE_CLIENT_SECRET,
  redirectUri: process.env.FREEE_REDIRECT_URI || 'http://localhost:3000/callback',
  baseUrl: 'https://accounts.secure.freee.co.jp',
  apiUrl: 'https://api.freee.co.jp'
};

// セッションストレージ（本番環境ではRedisやDBを使用）
const sessions = new Map();

// 1. 認証開始
app.get('/auth/freee', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  sessions.set(state, { timestamp: Date.now() });

  const authUrl = new URL(`${config.baseUrl}/public_api/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// 2. コールバック処理
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // エラーチェック
  if (error) {
    return res.status(400).json({ error: 'Authorization denied', details: error });
  }

  // stateチェック（CSRF攻撃防止）
  if (!state || !sessions.has(state)) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  // 期限チェック（10分）
  const session = sessions.get(state);
  if (Date.now() - session.timestamp > 10 * 60 * 1000) {
    sessions.delete(state);
    return res.status(400).json({ error: 'Authorization expired' });
  }

  try {
    // アクセストークン取得
    const tokenResponse = await axios.post(`${config.baseUrl}/public_api/token`, {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;
    
    // トークンを保存（実際のアプリでは暗号化してDBに保存）
    await saveUserTokens(req.userId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      scope: tokens.scope
    });

    sessions.delete(state);
    res.json({ success: true, message: 'Authentication successful' });

  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// 3. API呼び出し例
app.get('/api/companies', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.userId);
    
    const response = await axios.get(`${config.apiUrl}/api/1/companies`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Re-authentication required' });
    } else {
      res.status(500).json({ error: 'API request failed' });
    }
  }
});

// トークン管理ヘルパー関数
async function getValidAccessToken(userId) {
  const tokens = await getUserTokens(userId);
  
  // 5分前にリフレッシュ
  if (Date.now() + (5 * 60 * 1000) >= tokens.expiresAt) {
    return await refreshUserToken(userId);
  }
  
  return tokens.accessToken;
}

async function refreshUserToken(userId) {
  const tokens = await getUserTokens(userId);
  
  try {
    const response = await axios.post(`${config.baseUrl}/public_api/token`, {
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: tokens.refreshToken
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const newTokens = response.data;
    
    await saveUserTokens(userId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt: Date.now() + (newTokens.expires_in * 1000),
      scope: newTokens.scope
    });

    return newTokens.access_token;
  } catch (error) {
    throw new Error('Token refresh failed - re-authentication required');
  }
}

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Python + Flask実装

```python
from flask import Flask, request, redirect, session, jsonify, url_for
import requests
import secrets
import time
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key')

# 設定
FREEE_CONFIG = {
    'client_id': os.environ.get('FREEE_CLIENT_ID'),
    'client_secret': os.environ.get('FREEE_CLIENT_SECRET'),
    'redirect_uri': os.environ.get('FREEE_REDIRECT_URI', 'http://localhost:5000/callback'),
    'base_url': 'https://accounts.secure.freee.co.jp',
    'api_url': 'https://api.freee.co.jp'
}

# 1. 認証開始
@app.route('/auth/freee')
def start_auth():
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    session['auth_timestamp'] = time.time()
    
    auth_url = f"{FREEE_CONFIG['base_url']}/public_api/authorize"
    params = {
        'response_type': 'code',
        'client_id': FREEE_CONFIG['client_id'],
        'redirect_uri': FREEE_CONFIG['redirect_uri'],
        'state': state
    }
    
    query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    return redirect(f"{auth_url}?{query_string}")

# 2. コールバック処理
@app.route('/callback')
def handle_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    # エラーチェック
    if error:
        return jsonify({'error': 'Authorization denied', 'details': error}), 400
    
    # stateチェック
    if not state or state != session.get('oauth_state'):
        return jsonify({'error': 'Invalid state parameter'}), 400
    
    # 期限チェック（10分）
    auth_time = session.get('auth_timestamp', 0)
    if time.time() - auth_time > 600:  # 10分
        return jsonify({'error': 'Authorization expired'}), 400
    
    try:
        # アクセストークン取得
        token_data = {
            'grant_type': 'authorization_code',
            'client_id': FREEE_CONFIG['client_id'],
            'client_secret': FREEE_CONFIG['client_secret'],
            'code': code,
            'redirect_uri': FREEE_CONFIG['redirect_uri']
        }
        
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        response = requests.post(
            f"{FREEE_CONFIG['base_url']}/public_api/token",
            data=token_data,
            headers=headers
        )
        response.raise_for_status()
        
        tokens = response.json()
        
        # セッションにトークンを保存（実際のアプリではDBに暗号化して保存）
        session['access_token'] = tokens['access_token']
        session['refresh_token'] = tokens['refresh_token']
        session['token_expires_at'] = time.time() + tokens['expires_in']
        
        # 認証データをクリア
        session.pop('oauth_state', None)
        session.pop('auth_timestamp', None)
        
        return jsonify({'success': True, 'message': 'Authentication successful'})
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Token exchange failed', 'details': str(e)}), 500

# 3. API呼び出し例
@app.route('/api/companies')
def get_companies():
    try:
        access_token = get_valid_access_token()
        
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(
            f"{FREEE_CONFIG['api_url']}/api/1/companies",
            headers=headers
        )
        response.raise_for_status()
        
        return jsonify(response.json())
        
    except Exception as e:
        if 'invalid_token' in str(e) or 'unauthorized' in str(e).lower():
            return jsonify({'error': 'Re-authentication required'}), 401
        return jsonify({'error': 'API request failed', 'details': str(e)}), 500

# トークン管理ヘルパー関数
def get_valid_access_token():
    expires_at = session.get('token_expires_at', 0)
    
    # 5分前にリフレッシュ
    if time.time() + 300 >= expires_at:  # 5分 = 300秒
        return refresh_access_token()
    
    return session.get('access_token')

def refresh_access_token():
    refresh_token = session.get('refresh_token')
    if not refresh_token:
        raise Exception('No refresh token available')
    
    try:
        token_data = {
            'grant_type': 'refresh_token',
            'client_id': FREEE_CONFIG['client_id'],
            'client_secret': FREEE_CONFIG['client_secret'],
            'refresh_token': refresh_token
        }
        
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        response = requests.post(
            f"{FREEE_CONFIG['base_url']}/public_api/token",
            data=token_data,
            headers=headers
        )
        response.raise_for_status()
        
        tokens = response.json()
        
        # 新しいトークンを保存
        session['access_token'] = tokens['access_token']
        session['refresh_token'] = tokens['refresh_token']
        session['token_expires_at'] = time.time() + tokens['expires_in']
        
        return tokens['access_token']
        
    except requests.exceptions.RequestException as e:
        raise Exception('Token refresh failed - re-authentication required')

if __name__ == '__main__':
    app.run(debug=True)
```

## 環境変数設定例

### .env ファイル

```env
# Freee API認証情報
FREEE_CLIENT_ID=your_client_id_here
FREEE_CLIENT_SECRET=your_client_secret_here
FREEE_REDIRECT_URI=http://localhost:3000/callback

# アプリケーション設定
FLASK_SECRET_KEY=your_secret_key_here
NODE_ENV=development

# データベース（本番環境用）
DATABASE_URL=postgresql://user:password@localhost/freee_app
REDIS_URL=redis://localhost:6379
```

## MCPでの使用例

### アクセストークン自動管理MCP

```yaml
# mcp/auth/token_manager.yaml
description: Freee APIアクセストークンの自動管理
steps:
  - 環境変数からトークン情報を読み込み
  - 有効期限をチェック
  - 必要に応じてリフレッシュトークンでアクセストークンを更新
  - 新しいトークンを環境変数に保存
usage: 他のMCPから呼び出して有効なアクセストークンを取得
```

### API呼び出しヘルパーMCP

```yaml
# mcp/auth/api_helper.yaml  
description: 認証付きFreee API呼び出しヘルパー
params:
  - endpoint: required (API endpoint)
  - method: optional (GET/POST/PUT/DELETE)
  - data: optional (request body)
steps:
  - 有効なアクセストークンを取得
  - Authorizationヘッダーを設定してAPI呼び出し
  - 401エラーの場合はトークンリフレッシュして再試行
  - レスポンスを返却
```

## セキュリティチェックリスト

- [ ] HTTPS通信のみ使用
- [ ] stateパラメータでCSRF攻撃防止
- [ ] トークンの安全な保存（暗号化）
- [ ] 適切な有効期限管理
- [ ] エラーハンドリングの実装
- [ ] ログにトークンを出力しない
- [ ] 環境変数でクレデンシャル管理