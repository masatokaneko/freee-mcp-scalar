#!/usr/bin/env node

import 'dotenv/config';
import { FreeeMCPServer } from './mcp-server.js';

// メイン関数
async function main() {
  try {
    // 環境変数から設定を読み込み
    const config = {
      clientId: process.env.FREEE_CLIENT_ID || '',
      clientSecret: process.env.FREEE_CLIENT_SECRET || '',
      companyId: process.env.FREEE_COMPANY_ID,
      redirectUri: process.env.FREEE_REDIRECT_URI || 'http://127.0.0.1:8080/callback',
      baseUrl: process.env.FREEE_BASE_URL || 'https://accounts.secure.freee.co.jp',
      apiUrl: process.env.FREEE_API_URL || 'https://api.freee.co.jp',
      port: process.env.FREEE_CALLBACK_PORT ? parseInt(process.env.FREEE_CALLBACK_PORT) : 8080
    };

    // 必須設定のチェック
    if (!config.clientId || !config.clientSecret) {
      console.error('❌ Missing required environment variables:');
      console.error('   FREEE_CLIENT_ID and FREEE_CLIENT_SECRET are required');
      console.error('');
      console.error('Please set these environment variables and try again.');
      console.error('For setup instructions, see: README.md');
      process.exit(1);
    }

    // MCPサーバーを開始
    const server = new FreeeMCPServer(config);
    await server.start();

  } catch (error) {
    console.error('❌ Failed to start Freee MCP Server:', error.message);
    
    if (error.message.includes('Authentication')) {
      console.error('');
      console.error('💡 Authentication issue detected. Try running:');
      console.error('   npm run auth');
      console.error('');
    }
    
    process.exit(1);
  }
}

// 未処理エラーのハンドリング
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// メイン関数を実行
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});