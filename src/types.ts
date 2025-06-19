import { z } from 'zod';

// Freee API Base Types
export const FreeeConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  companyId: z.string().optional(),
  redirectUri: z.string().default('http://127.0.0.1:8080/callback'),
  baseUrl: z.string().default('https://accounts.secure.freee.co.jp'),
  apiUrl: z.string().default('https://api.freee.co.jp'),
  port: z.number().default(8080)
});

export type FreeeConfig = z.infer<typeof FreeeConfigSchema>;

// Token Management
export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string().default('Bearer'),
  scope: z.string().optional(),
  expires_at: z.number().optional()
});

export type Token = z.infer<typeof TokenSchema>;

// Company Schema
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  name_kana: z.string().optional(),
  display_name: z.string().optional(),
  tax_at_source_calc_type: z.number().optional(),
  contact_name: z.string().optional(),
  head_count: z.number().optional(),
  corporate_number: z.string().optional()
});

export type Company = z.infer<typeof CompanySchema>;

// Partner Schema
export const PartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortcut1: z.string().optional(),
  shortcut2: z.string().optional(),
  long_name: z.string().optional(),
  name_kana: z.string().optional(),
  default_title: z.string().optional(),
  phone: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().optional(),
  address_attributes: z.object({
    zipcode: z.string().optional(),
    prefecture_code: z.number().optional(),
    street_name1: z.string().optional(),
    street_name2: z.string().optional()
  }).optional(),
  partner_doc_setting_attributes: z.object({
    sending_method: z.number().optional()
  }).optional(),
  partner_bank_account_attributes: z.object({
    bank_name: z.string().optional(),
    bank_name_kana: z.string().optional(),
    bank_code: z.string().optional(),
    branch_name: z.string().optional(),
    branch_kana: z.string().optional(),
    branch_code: z.string().optional(),
    account_type: z.string().optional(),
    account_number: z.string().optional(),
    account_name: z.string().optional(),
    long_account_name: z.string().optional()
  }).optional()
});

export type Partner = z.infer<typeof PartnerSchema>;

// Account Item Schema
export const AccountItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  update_date: z.string(),
  shortcut: z.string().optional(),
  shortcut_num: z.string().optional(),
  tax_code: z.number().optional(),
  default_tax_id: z.number().optional(),
  default_tax_code: z.number().optional(),
  account_category: z.string().optional(),
  account_category_id: z.number().optional(),
  categories: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  walletable_id: z.number().optional(),
  group_name: z.string().optional(),
  corresponding_income_id: z.number().optional(),
  corresponding_expense_id: z.number().optional()
});

export type AccountItem = z.infer<typeof AccountItemSchema>;

// Deal Schema
export const DealSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  issue_date: z.string(),
  due_date: z.string().optional(),
  amount: z.number(),
  due_amount: z.number().optional(),
  type: z.enum(['income', 'expense']),
  partner_id: z.number().optional(),
  partner_code: z.string().optional(),
  ref_number: z.string().optional(),
  status: z.string().optional(),
  details: z.array(z.object({
    id: z.number().optional(),
    account_item_id: z.number(),
    tax_code: z.number().optional(),
    item_id: z.number().optional(),
    section_id: z.number().optional(),
    tag_ids: z.array(z.number()).optional(),
    segment_1_tag_id: z.number().optional(),
    segment_2_tag_id: z.number().optional(),
    segment_3_tag_id: z.number().optional(),
    amount: z.number(),
    vat: z.number().optional(),
    description: z.string().optional()
  }))
});

export type Deal = z.infer<typeof DealSchema>;

// API Response Schemas
export const ApiResponseSchema = z.object({
  meta: z.object({
    total_count: z.number().optional(),
    total_pages: z.number().optional(),
    current_page: z.number().optional(),
    per_page: z.number().optional()
  }).optional()
});

export const CompaniesResponseSchema = ApiResponseSchema.extend({
  companies: z.array(CompanySchema)
});

export const PartnersResponseSchema = ApiResponseSchema.extend({
  partners: z.array(PartnerSchema)
});

export const AccountItemsResponseSchema = ApiResponseSchema.extend({
  account_items: z.array(AccountItemSchema)
});

export const DealsResponseSchema = ApiResponseSchema.extend({
  deals: z.array(DealSchema)
});

// MCP Tool Definition
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (params: any) => Promise<any>;
}

// Error Types
export class FreeeAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FreeeAPIError';
  }
}

export class AuthenticationError extends FreeeAPIError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Token has expired', details?: any) {
    super(message, details);
    this.name = 'TokenExpiredError';
  }
}

export class RateLimitError extends FreeeAPIError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}