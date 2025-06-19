#!/usr/bin/env node

import { createServer } from 'http';
import { URL } from 'url';
import { randomBytes, createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { FreeeConfig, Token, TokenSchema, AuthenticationError } from './types.js';

export class FreeeAuthManager {
  private config: FreeeConfig;
  private tokenPath: string;
  private codeVerifier: string | null = null;

  constructor(config: FreeeConfig) {
    this.config = config;
    this.tokenPath = path.join(os.homedir(), '.config', 'freee-mcp', 'tokens.json');
  }

  /**
   * OAuth 2.0 + PKCE認証フローを開始
   */
  async authenticate(): Promise<Token> {
    console.log('🔐 Starting OAuth 2.0 + PKCE authentication...');
    
    // PKCE用のcode_verifierとcode_challengeを生成
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(this.codeVerifier);
    
    // state生成（CSRF攻撃防止）
    const state = randomBytes(32).toString('hex');
    
    // 認証URLを構築
    const authUrl = this.buildAuthUrl(codeChallenge, state);
    
    console.log('🌐 Opening browser for authentication...');
    console.log(`Auth URL: ${authUrl}`);
    
    // ブラウザで認証URLを開く
    await this.openBrowser(authUrl);
    
    // コールバックサーバーを起動してコードを受信
    const authCode = await this.startCallbackServer(state);
    
    // 認証コードをアクセストークンに交換
    const tokens = await this.exchangeCodeForTokens(authCode);
    
    // トークンを保存
    await this.saveTokens(tokens);
    
    console.log('✅ Authentication successful!');
    return tokens;
  }

  /**
   * 保存されたトークンを読み込み
   */
  async loadTokens(): Promise<Token | null> {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf-8');
      const parsed = JSON.parse(data);
      return TokenSchema.parse(parsed);
    } catch (error) {
      return null;
    }
  }

  /**
   * 有効なアクセストークンを取得（自動リフレッシュ付き）
   */
  async getValidAccessToken(): Promise<string> {
    let tokens = await this.loadTokens();
    
    if (!tokens) {
      throw new AuthenticationError('No tokens found. Please authenticate first.');
    }

    // トークンの有効期限チェック（5分前にリフレッシュ）
    const bufferTime = 5 * 60 * 1000; // 5分
    const expiresAt = tokens.expires_at || (Date.now() + tokens.expires_in * 1000);
    
    if (Date.now() + bufferTime >= expiresAt) {
      console.log('🔄 Refreshing access token...');
      tokens = await this.refreshToken(tokens.refresh_token);
    }

    return tokens.access_token;
  }

  /**
   * リフレッシュトークンでアクセストークンを更新
   */
  async refreshToken(refreshToken: string): Promise<Token> {
    const response = await fetch(`${this.config.baseUrl}/public_api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Token refresh failed: ${error}`);
    }

    const data = await response.json();
    const tokens = TokenSchema.parse({
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    });

    await this.saveTokens(tokens);
    console.log('✅ Token refreshed successfully');
    
    return tokens;
  }

  /**
   * トークンを取り消し
   */
  async revokeToken(): Promise<void> {
    const tokens = await this.loadTokens();
    if (!tokens) return;

    try {
      await fetch(`${this.config.baseUrl}/public_api/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: tokens.access_token,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });
    } catch (error) {
      console.warn('Token revocation failed:', error);
    }

    // ローカルトークンを削除
    try {
      await fs.unlink(this.tokenPath);
      console.log('✅ Tokens revoked and removed locally');
    } catch (error) {
      console.warn('Failed to remove local tokens:', error);
    }
  }

  // Private methods

  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  private buildAuthUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      scope: 'read write'
    });

    return `${this.config.baseUrl}/public_api/authorize?${params}`;
  }

  private async openBrowser(url: string): Promise<void> {
    const { spawn } = await import('child_process');
    
    const platform = process.platform;
    let command: string;
    let args: string[];

    switch (platform) {
      case 'darwin':
        command = 'open';
        args = [url];
        break;
      case 'win32':
        command = 'cmd';
        args = ['/c', 'start', url];
        break;
      default:
        command = 'xdg-open';
        args = [url];
        break;
    }

    spawn(command, args, { detached: true, stdio: 'ignore' });
  }

  private async startCallbackServer(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.close();
        reject(new AuthenticationError('Authentication timeout (5 minutes)'));
      }, 5 * 60 * 1000); // 5分タイムアウト

      const server = createServer((req, res) => {
        const url = new URL(req.url!, `http://localhost:${this.config.port}`);
        
        if (url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          // HTML レスポンス
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Freee MCP Authentication</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: #4CAF50; }
                .error { color: #f44336; }
              </style>
            </head>
            <body>
              ${error ? 
                `<h1 class="error">❌ Authentication Failed</h1><p>Error: ${error}</p>` :
                code ?
                  `<h1 class="success">✅ Authentication Successful</h1><p>You can close this window.</p>` :
                  `<h1 class="error">❌ Authentication Failed</h1><p>No authorization code received.</p>`
              }
            </body>
            </html>
          `;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);

          clearTimeout(timeout);
          server.close();

          if (error) {
            reject(new AuthenticationError(`Authentication failed: ${error}`));
          } else if (!code) {
            reject(new AuthenticationError('No authorization code received'));
          } else if (state !== expectedState) {
            reject(new AuthenticationError('Invalid state parameter'));
          } else {
            resolve(code);
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      server.listen(this.config.port, '127.0.0.1', () => {
        console.log(`🔧 Callback server started on http://127.0.0.1:${this.config.port}/callback`);
      });

      server.on('error', (err) => {
        clearTimeout(timeout);
        reject(new AuthenticationError(`Server error: ${err.message}`));
      });
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<Token> {
    if (!this.codeVerifier) {
      throw new AuthenticationError('Code verifier not found');
    }

    const response = await fetch(`${this.config.baseUrl}/public_api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: this.codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    return TokenSchema.parse({
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    });
  }

  private async saveTokens(tokens: Token): Promise<void> {
    const dir = path.dirname(this.tokenPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
  }
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    clientId: process.env.FREEE_CLIENT_ID || '',
    clientSecret: process.env.FREEE_CLIENT_SECRET || '',
    redirectUri: process.env.FREEE_REDIRECT_URI || 'http://127.0.0.1:8080/callback',
    baseUrl: 'https://accounts.secure.freee.co.jp',
    apiUrl: 'https://api.freee.co.jp',
    port: parseInt(process.env.FREEE_CALLBACK_PORT || '8080')
  };

  if (!config.clientId || !config.clientSecret) {
    console.error('❌ Please set FREEE_CLIENT_ID and FREEE_CLIENT_SECRET environment variables');
    process.exit(1);
  }

  const authManager = new FreeeAuthManager(config);
  
  try {
    await authManager.authenticate();
    console.log('🎉 Authentication completed successfully!');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}