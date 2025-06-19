# Freee OAuth認証 完全ガイド

## 概要
Freee APIはOAuth 2.0 Authorization Code Grantを使用します。ユーザーのfreee資格情報を直接共有することなく、安全にAPIアクセスを可能にします。

## 認証フロー

### 1. アプリケーション登録
1. [freee開発者ページ](https://app.secure.freee.co.jp/developers/applications)でアプリケーションを登録
2. `client_id` と `client_secret` を取得
3. リダイレクトURIを設定

### 2. 認可コード取得

**認可URL (必須パラメータ):**
```
https://accounts.secure.freee.co.jp/public_api/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=RANDOM_STATE
```

**パラメータ詳細:**
- `response_type`: 必須 - "code"固定
- `client_id`: 必須 - アプリケーションのクライアントID
- `redirect_uri`: 必須 - 登録済みリダイレクトURI
- `state`: 推奨 - CSRF攻撃防止用ランダム文字列

**レスポンス例:**
```
https://your-redirect-uri.com/callback?code=AUTHORIZATION_CODE&state=RANDOM_STATE
```

### 3. アクセストークン取得

**cURL例:**
```bash
curl -X POST https://accounts.secure.freee.co.jp/public_api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=RECEIVED_CODE" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

**成功レスポンス例:**
```json
{
  "access_token": "access_token_value",
  "token_type": "Bearer",
  "expires_in": 21600,
  "refresh_token": "refresh_token_value",
  "scope": "read write"
}
```

### 4. アクセストークン使用

**APIリクエスト例:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.freee.co.jp/api/1/companies
```

## トークン管理

### アクセストークン
- **有効期限**: 6時間
- **用途**: API呼び出し時のAuthorization header
- **形式**: `Bearer {access_token}`

### リフレッシュトークン
- **有効期限**: 90日（2023年12月から）
- **用途**: 新しいアクセストークンの取得
- **注意**: 一度使用すると新しいリフレッシュトークンが発行される

## 重要な注意事項

1. **セキュリティ**:
   - 必ずHTTPSを使用
   - トークンを安全に保存
   - stateパラメータでCSRF攻撃を防止

2. **トークン有効期限**:
   - アクセストークン: 6時間
   - リフレッシュトークン: 90日

3. **リフレッシュトークンの扱い**:
   - 使用後は新しいトークンを保存
   - 古いトークンは無効化される

4. **エラーハンドリング**:
   - HTTPステータスコードを確認
   - レスポンス形式を検証
   - 適切なエラー処理を実装