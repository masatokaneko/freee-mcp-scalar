import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FreeeAPIClient } from './api-client.js';
import { FreeeConfig, FreeeConfigSchema, MCPTool } from './types.js';

export class FreeeMCPServer {
  private server: Server;
  private apiClient: FreeeAPIClient;
  private tools: MCPTool[] = [];

  constructor(config: FreeeConfig) {
    this.server = new Server(
      {
        name: 'freee-mcp-scalar',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiClient = new FreeeAPIClient(config);
    this.initializeTools();
    this.setupHandlers();
  }

  /**
   * MCPツールを初期化
   */
  private initializeTools(): void {
    // 会社情報
    this.tools.push({
      name: 'get_companies',
      description: 'Get list of companies accessible to the authenticated user',
      inputSchema: z.object({}),
      handler: () => this.apiClient.getCompanies()
    });

    this.tools.push({
      name: 'get_company',
      description: 'Get details of a specific company',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID')
      }),
      handler: (params) => this.apiClient.getCompany(params.company_id)
    });

    // 取引先
    this.tools.push({
      name: 'get_partners',
      description: 'Get list of partners (customers/vendors)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        keyword: z.string().optional().describe('Search keyword'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getPartners(params.company_id, {
        keyword: params.keyword,
        offset: params.offset,
        limit: params.limit
      })
    });

    // 勘定科目
    this.tools.push({
      name: 'get_account_items',
      description: 'Get list of account items (chart of accounts)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        base_date: z.string().optional().describe('Base date (YYYY-MM-DD)')
      }),
      handler: (params) => this.apiClient.getAccountItems(params.company_id, {
        base_date: params.base_date
      })
    });

    // 取引
    this.tools.push({
      name: 'get_deals',
      description: 'Get list of deals (transactions)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        partner_id: z.string().optional().describe('Partner ID filter'),
        account_item_id: z.string().optional().describe('Account item ID filter'),
        start_issue_date: z.string().optional().describe('Start issue date (YYYY-MM-DD)'),
        end_issue_date: z.string().optional().describe('End issue date (YYYY-MM-DD)'),
        type: z.enum(['income', 'expense']).optional().describe('Deal type'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getDeals(params.company_id, {
        partner_id: params.partner_id,
        account_item_id: params.account_item_id,
        start_issue_date: params.start_issue_date,
        end_issue_date: params.end_issue_date,
        type: params.type,
        offset: params.offset,
        limit: params.limit
      })
    });

    this.tools.push({
      name: 'create_deal',
      description: 'Create a new deal (transaction)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        issue_date: z.string().describe('Issue date (YYYY-MM-DD)'),
        type: z.enum(['income', 'expense']).describe('Deal type'),
        partner_id: z.number().optional().describe('Partner ID'),
        ref_number: z.string().optional().describe('Reference number'),
        details: z.array(z.object({
          account_item_id: z.number().describe('Account item ID'),
          amount: z.number().describe('Amount'),
          tax_code: z.number().optional().describe('Tax code'),
          description: z.string().optional().describe('Description')
        })).describe('Deal details')
      }),
      handler: (params) => this.apiClient.createDeal(params.company_id, {
        issue_date: params.issue_date,
        type: params.type,
        partner_id: params.partner_id,
        ref_number: params.ref_number,
        details: params.details
      })
    });

    // 請求書
    this.tools.push({
      name: 'get_invoices',
      description: 'Get list of invoices',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        partner_id: z.string().optional().describe('Partner ID filter'),
        issue_date_start: z.string().optional().describe('Start issue date (YYYY-MM-DD)'),
        issue_date_end: z.string().optional().describe('End issue date (YYYY-MM-DD)'),
        invoice_status: z.string().optional().describe('Invoice status filter'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getInvoices(params.company_id, {
        partner_id: params.partner_id,
        issue_date_start: params.issue_date_start,
        issue_date_end: params.issue_date_end,
        invoice_status: params.invoice_status,
        offset: params.offset,
        limit: params.limit
      })
    });

    this.tools.push({
      name: 'create_invoice',
      description: 'Create a new invoice',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        issue_date: z.string().describe('Issue date (YYYY-MM-DD)'),
        partner_id: z.number().describe('Partner ID'),
        invoice_contents: z.array(z.object({
          order: z.number().describe('Line order'),
          type: z.literal('normal').describe('Content type'),
          account_item_id: z.number().describe('Account item ID'),
          description: z.string().describe('Description'),
          unit_price: z.number().describe('Unit price'),
          qty: z.number().describe('Quantity'),
          unit: z.string().optional().describe('Unit'),
          tax_code: z.number().optional().describe('Tax code')
        })).describe('Invoice contents')
      }),
      handler: (params) => this.apiClient.createInvoice(params.company_id, {
        issue_date: params.issue_date,
        partner_id: params.partner_id,
        invoice_contents: params.invoice_contents
      })
    });

    // 振替伝票
    this.tools.push({
      name: 'get_manual_journals',
      description: 'Get list of manual journals',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        start_issue_date: z.string().optional().describe('Start issue date (YYYY-MM-DD)'),
        end_issue_date: z.string().optional().describe('End issue date (YYYY-MM-DD)'),
        entry_side: z.enum(['debit', 'credit']).optional().describe('Entry side filter'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getManualJournals(params.company_id, {
        start_issue_date: params.start_issue_date,
        end_issue_date: params.end_issue_date,
        entry_side: params.entry_side,
        offset: params.offset,
        limit: params.limit
      })
    });

    this.tools.push({
      name: 'create_manual_journal',
      description: 'Create a new manual journal entry',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        issue_date: z.string().describe('Issue date (YYYY-MM-DD)'),
        details: z.array(z.object({
          entry_side: z.enum(['debit', 'credit']).describe('Entry side'),
          account_item_id: z.number().describe('Account item ID'),
          amount: z.number().describe('Amount'),
          partner_id: z.number().optional().describe('Partner ID'),
          description: z.string().optional().describe('Description')
        })).describe('Journal details')
      }),
      handler: (params) => this.apiClient.createManualJournal(params.company_id, {
        issue_date: params.issue_date,
        details: params.details
      })
    });

    // 試算表
    this.tools.push({
      name: 'get_trial_pl',
      description: 'Get trial balance for P&L (Profit & Loss)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        start_date: z.string().describe('Start date (YYYY-MM-DD)'),
        end_date: z.string().describe('End date (YYYY-MM-DD)'),
        breakdown_display_type: z.enum(['partner', 'item', 'section', 'tag']).optional().describe('Breakdown type')
      }),
      handler: (params) => this.apiClient.getTrialPL(params.company_id, {
        start_date: params.start_date,
        end_date: params.end_date,
        breakdown_display_type: params.breakdown_display_type
      })
    });

    this.tools.push({
      name: 'get_trial_bs',
      description: 'Get trial balance for B/S (Balance Sheet)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        start_date: z.string().describe('Start date (YYYY-MM-DD)'),
        end_date: z.string().describe('End date (YYYY-MM-DD)'),
        breakdown_display_type: z.enum(['partner', 'item', 'section', 'tag']).optional().describe('Breakdown type')
      }),
      handler: (params) => this.apiClient.getTrialBS(params.company_id, {
        start_date: params.start_date,
        end_date: params.end_date,
        breakdown_display_type: params.breakdown_display_type
      })
    });

    // その他
    this.tools.push({
      name: 'get_expense_applications',
      description: 'Get list of expense applications',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        start_application_date: z.string().optional().describe('Start application date (YYYY-MM-DD)'),
        end_application_date: z.string().optional().describe('End application date (YYYY-MM-DD)'),
        application_status: z.string().optional().describe('Application status filter'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getExpenseApplications(params.company_id, {
        start_application_date: params.start_application_date,
        end_application_date: params.end_application_date,
        application_status: params.application_status,
        offset: params.offset,
        limit: params.limit
      })
    });

    this.tools.push({
      name: 'get_taxes',
      description: 'Get list of tax codes',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID')
      }),
      handler: (params) => this.apiClient.getTaxes(params.company_id)
    });

    this.tools.push({
      name: 'get_segments',
      description: 'Get list of segments (departments/projects)',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        segment_tag: z.enum(['1', '2', '3']).optional().describe('Segment tag filter')
      }),
      handler: (params) => this.apiClient.getSegments(params.company_id, {
        segment_tag: params.segment_tag
      })
    });

    this.tools.push({
      name: 'get_items',
      description: 'Get list of items',
      inputSchema: z.object({
        company_id: z.string().describe('Company ID'),
        keyword: z.string().optional().describe('Search keyword'),
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getItems(params.company_id, {
        keyword: params.keyword,
        offset: params.offset,
        limit: params.limit
      })
    });

    this.tools.push({
      name: 'get_banks',
      description: 'Get list of supported banks for integration',
      inputSchema: z.object({
        offset: z.number().optional().describe('Offset for pagination'),
        limit: z.number().optional().describe('Limit for pagination')
      }),
      handler: (params) => this.apiClient.getBanks({
        offset: params.offset,
        limit: params.limit
      })
    });
  }

  /**
   * MCPハンドラーを設定
   */
  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.find(t => t.name === name);
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }

      try {
        // パラメータの検証
        const validatedArgs = tool.inputSchema.parse(args);
        
        // ツールの実行
        const result = await tool.handler(validatedArgs);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          );
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  /**
   * MCPサーバーを開始
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Freee MCP Server started');
  }
}

// 設定を読み込んでサーバーを起動
async function main() {
  try {
    const config = FreeeConfigSchema.parse({
      clientId: process.env.FREEE_CLIENT_ID,
      clientSecret: process.env.FREEE_CLIENT_SECRET,
      companyId: process.env.FREEE_COMPANY_ID,
      redirectUri: process.env.FREEE_REDIRECT_URI,
      port: process.env.FREEE_CALLBACK_PORT ? parseInt(process.env.FREEE_CALLBACK_PORT) : undefined,
    });

    if (!config.clientId || !config.clientSecret) {
      throw new Error('FREEE_CLIENT_ID and FREEE_CLIENT_SECRET are required');
    }

    const server = new FreeeMCPServer(config);
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}