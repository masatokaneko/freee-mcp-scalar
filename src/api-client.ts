import { FreeeConfig, FreeeAPIError, RateLimitError, AuthenticationError } from './types.js';
import { FreeeAuthManager } from './auth.js';

export class FreeeAPIClient {
  private config: FreeeConfig;
  private authManager: FreeeAuthManager;
  private baseDelay = 1000; // 1秒
  private maxRetries = 3;

  constructor(config: FreeeConfig) {
    this.config = config;
    this.authManager = new FreeeAuthManager(config);
  }

  /**
   * 認証付きAPIリクエスト（自動リトライ付き）
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      const accessToken = await this.authManager.getValidAccessToken();
      
      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // レート制限の処理
      if (response.status === 429) {
        if (retryCount >= this.maxRetries) {
          throw new RateLimitError('Rate limit exceeded after max retries');
        }

        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.log(`⏳ Rate limited. Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retryCount + 1);
      }

      // 認証エラーの処理
      if (response.status === 401) {
        throw new AuthenticationError('Access token invalid or expired');
      }

      // その他のHTTPエラー
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new FreeeAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData
        );
      }

      const data = await response.json();
      return data as T;

    } catch (error) {
      if (error instanceof FreeeAPIError) {
        throw error;
      }
      
      throw new FreeeAPIError(
        `Request failed: ${error.message}`,
        undefined,
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * GET リクエスト
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST リクエスト
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT リクエスト
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE リクエスト
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 具体的なAPI呼び出しメソッド

  /**
   * 事業所一覧を取得
   */
  async getCompanies() {
    return this.get('/api/1/companies');
  }

  /**
   * 指定事業所の詳細を取得
   */
  async getCompany(companyId: string) {
    return this.get(`/api/1/companies/${companyId}`);
  }

  /**
   * 取引先一覧を取得
   */
  async getPartners(companyId: string, params?: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/partners', { company_id: companyId, ...params });
  }

  /**
   * 勘定科目一覧を取得
   */
  async getAccountItems(companyId: string, params?: {
    base_date?: string;
  }) {
    return this.get('/api/1/account_items', { company_id: companyId, ...params });
  }

  /**
   * 取引一覧を取得
   */
  async getDeals(companyId: string, params?: {
    partner_id?: string;
    account_item_id?: string;
    start_issue_date?: string;
    end_issue_date?: string;
    start_due_date?: string;
    end_due_date?: string;
    type?: 'income' | 'expense';
    status?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/deals', { company_id: companyId, ...params });
  }

  /**
   * 取引を作成
   */
  async createDeal(companyId: string, dealData: {
    issue_date: string;
    type: 'income' | 'expense';
    partner_id?: number;
    ref_number?: string;
    details: Array<{
      account_item_id: number;
      amount: number;
      tax_code?: number;
      item_id?: number;
      section_id?: number;
      tag_ids?: number[];
      description?: string;
    }>;
  }) {
    return this.post('/api/1/deals', { company_id: companyId, ...dealData });
  }

  /**
   * 請求書一覧を取得
   */
  async getInvoices(companyId: string, params?: {
    partner_id?: string;
    issue_date_start?: string;
    issue_date_end?: string;
    due_date_start?: string;
    due_date_end?: string;
    invoice_status?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/invoices', { company_id: companyId, ...params });
  }

  /**
   * 請求書を作成
   */
  async createInvoice(companyId: string, invoiceData: {
    issue_date: string;
    partner_id: number;
    invoice_contents: Array<{
      order: number;
      type: 'normal';
      account_item_id: number;
      description: string;
      unit_price: number;
      qty: number;
      unit?: string;
      tax_code?: number;
    }>;
    invoice_layout?: string;
    tax_entry_method?: string;
  }) {
    return this.post('/api/1/invoices', { company_id: companyId, ...invoiceData });
  }

  /**
   * 振替伝票一覧を取得
   */
  async getManualJournals(companyId: string, params?: {
    start_issue_date?: string;
    end_issue_date?: string;
    entry_side?: 'debit' | 'credit';
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/manual_journals', { company_id: companyId, ...params });
  }

  /**
   * 振替伝票を作成
   */
  async createManualJournal(companyId: string, journalData: {
    issue_date: string;
    details: Array<{
      entry_side: 'debit' | 'credit';
      account_item_id: number;
      amount: number;
      partner_id?: number;
      item_id?: number;
      section_id?: number;
      tag_ids?: number[];
      description?: string;
    }>;
  }) {
    return this.post('/api/1/manual_journals', { company_id: companyId, ...journalData });
  }

  /**
   * 試算表（PL）を取得
   */
  async getTrialPL(companyId: string, params: {
    start_date: string;
    end_date: string;
    breakdown_display_type?: 'partner' | 'item' | 'section' | 'tag';
  }) {
    return this.get('/api/1/reports/trial_pl', { company_id: companyId, ...params });
  }

  /**
   * 試算表（BS）を取得
   */
  async getTrialBS(companyId: string, params: {
    start_date: string;
    end_date: string;
    breakdown_display_type?: 'partner' | 'item' | 'section' | 'tag';
  }) {
    return this.get('/api/1/reports/trial_bs', { company_id: companyId, ...params });
  }

  /**
   * 経費申請一覧を取得
   */
  async getExpenseApplications(companyId: string, params?: {
    start_application_date?: string;
    end_application_date?: string;
    applicant_id?: string;
    application_status?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/expense_applications', { company_id: companyId, ...params });
  }

  /**
   * 税区分一覧を取得
   */
  async getTaxes(companyId: string) {
    return this.get('/api/1/taxes', { company_id: companyId });
  }

  /**
   * セグメント一覧を取得
   */
  async getSegments(companyId: string, params?: {
    segment_tag?: '1' | '2' | '3';
  }) {
    return this.get('/api/1/segments', { company_id: companyId, ...params });
  }

  /**
   * 品目一覧を取得
   */
  async getItems(companyId: string, params?: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/items', { company_id: companyId, ...params });
  }

  /**
   * 連携可能な金融機関一覧を取得
   */
  async getBanks(params?: {
    offset?: number;
    limit?: number;
  }) {
    return this.get('/api/1/banks', params);
  }
}