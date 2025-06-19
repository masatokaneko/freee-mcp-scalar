# Freee MCP Scalar

> **Production-Ready Freee Accounting API MCP Server**
> 
> Comprehensive TypeScript implementation providing all Freee API endpoints as Model Context Protocol tools with advanced authentication, validation, and error handling.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0%20%2B%20PKCE-green)](https://oauth.net/2/)
[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-brightgreen)](https://nodejs.org/)

## 🚀 Features

### ✅ Complete API Coverage
- **30+ Freee API endpoints** as MCP tools
- **Automatic tool generation** with Zod validation
- **OAuth 2.0 + PKCE** secure authentication
- **Automatic token refresh** with persistent storage
- **Rate limiting** with exponential backoff
- **Comprehensive error handling**

### 🛠 Core APIs
- **Companies** - Business entity management
- **Deals** - Income/expense transactions (CRUD)
- **Invoices** - Invoice management (CRUD)
- **Manual Journals** - Journal entries (CRUD)
- **Account Items** - Chart of accounts (CRUD)
- **Partners** - Customer/vendor management
- **Trial Balance** - P&L and B/S reports
- **Expenses** - Expense applications

### 📊 Additional APIs
- **Items** - Product/service catalog
- **Taxes** - Tax codes and rates
- **Segments** - Departments/projects
- **Banks** - Financial institution integration
- **Reports** - Various financial reports

## 🏁 Quick Start

### Prerequisites
- **Node.js ≥ 20.0.0**
- **npm or pnpm**
- **Freee Developer Account**

### 1. Installation
```bash
git clone https://github.com/yourusername/freee-mcp-scalar.git
cd freee-mcp-scalar
npm install
```

### 2. Freee App Registration
1. Go to [Freee Developer Console](https://app.secure.freee.co.jp/developers/applications)
2. Create a new application
3. Set redirect URI: `http://127.0.0.1:8080/callback`
4. Note your `Client ID` and `Client Secret`

### 3. Environment Setup
```bash
cp auth/.env.example .env
```

Edit `.env`:
```env
FREEE_CLIENT_ID=your_client_id_here
FREEE_CLIENT_SECRET=your_client_secret_here
FREEE_COMPANY_ID=your_company_id_here  # Optional
```

### 4. Authentication
```bash
npm run auth
```
This will:
- Open your browser for Freee login
- Start a temporary callback server
- Save tokens securely to `~/.config/freee-mcp/tokens.json`

### 5. Build & Start
```bash
npm run build
npm start
```

## 🔧 Configuration

### Claude Desktop Integration
Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "freee": {
      "command": "node",
      "args": ["/path/to/freee-mcp-scalar/dist/index.js"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id"
      }
    }
  }
}
```

### Available Environment Variables
```env
# Required
FREEE_CLIENT_ID=               # Your Freee app client ID
FREEE_CLIENT_SECRET=           # Your Freee app client secret

# Optional
FREEE_COMPANY_ID=              # Default company ID
FREEE_REDIRECT_URI=            # Custom redirect URI (default: http://127.0.0.1:8080/callback)
FREEE_CALLBACK_PORT=           # Custom callback port (default: 8080)
FREEE_BASE_URL=                # Custom auth base URL
FREEE_API_URL=                 # Custom API base URL
```

## 📋 Available MCP Tools

### Company Management
- `get_companies` - List accessible companies
- `get_company` - Get company details

### Transaction Management
- `get_deals` - List transactions with filters
- `create_deal` - Create income/expense transactions
- `get_invoices` - List invoices with filters
- `create_invoice` - Create new invoices
- `get_manual_journals` - List manual journal entries
- `create_manual_journal` - Create journal entries

### Master Data
- `get_partners` - List customers/vendors
- `get_account_items` - Chart of accounts
- `get_items` - Product/service catalog
- `get_taxes` - Tax codes and rates
- `get_segments` - Departments/projects
- `get_banks` - Supported banks

### Reports
- `get_trial_pl` - P&L trial balance
- `get_trial_bs` - B/S trial balance
- `get_expense_applications` - Expense reports

## 💡 Usage Examples

### Get Company Information
```json
{
  "tool": "get_companies",
  "parameters": {}
}
```

### Create a Transaction
```json
{
  "tool": "create_deal",
  "parameters": {
    "company_id": "123456",
    "issue_date": "2024-01-15",
    "type": "expense",
    "partner_id": 1001,
    "details": [
      {
        "account_item_id": 6001,
        "amount": 50000,
        "description": "Office rent"
      }
    ]
  }
}
```

### Get Monthly P&L Report
```json
{
  "tool": "get_trial_pl",
  "parameters": {
    "company_id": "123456",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "breakdown_display_type": "partner"
  }
}
```

## 🔐 Security Features

### Authentication
- **OAuth 2.0 + PKCE** for enhanced security
- **Automatic token refresh** (90-day refresh token lifecycle)
- **Secure token storage** with encryption support
- **CSRF protection** with state parameter validation

### API Security
- **Input validation** with Zod schemas
- **Rate limiting** with exponential backoff
- **Error sanitization** to prevent information disclosure
- **TLS encryption** for all communications

### Development Security
- **Environment variable isolation**
- **Secret management** best practices
- **Audit logging** for all operations
- **Graceful error handling**

## 🛠 Development

### Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript to JavaScript
npm run validate     # Type checking without build
npm run lint         # ESLint code analysis
npm run test         # Run test suite
npm run auth         # Interactive authentication
```

### Project Structure
```
freee-mcp-scalar/
├── src/
│   ├── types.ts           # TypeScript definitions
│   ├── auth.ts            # OAuth 2.0 + PKCE authentication
│   ├── api-client.ts      # Freee API client with retry logic
│   ├── mcp-server.ts      # MCP server implementation
│   └── index.ts           # Main entry point
├── bin/
│   └── freee_authenticate # Authentication CLI script
├── mcp/                   # Legacy YAML templates (reference)
├── auth/                  # Authentication documentation
└── dist/                  # Built JavaScript files
```

## 📚 Documentation

- **[OAuth Guide](auth/oauth_instructions.md)** - Complete OAuth 2.0 setup
- **[Token Management](auth/token_refresh_guide.md)** - Refresh token handling
- **[Implementation Examples](auth/implementation_examples.md)** - Code examples
- **[Security Guide](auth/security_best_practices.md)** - Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Freee API Documentation](https://developer.freee.co.jp/reference/accounting/reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/chat)

## ⚠️ Important Notes

- **Never commit secrets** - Use environment variables
- **Token security** - Tokens are stored in `~/.config/freee-mcp/tokens.json`
- **Rate limits** - Freee API has rate limits; the client handles this automatically
- **Production use** - Review security guidelines before production deployment

---

**Made with ❤️ for the Freee developer community**