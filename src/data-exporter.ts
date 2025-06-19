import { z } from 'zod';
import { FreeeAPIClient } from './api-client.js';
import { FreeeConfig } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * データエクスポート・更新ツール
 * freeeのマスタデータと試算表データを最新状態で保持
 */
export class DataExporter {
  private apiClient: FreeeAPIClient;
  private exportDataDir: string;

  constructor(config: FreeeConfig) {
    this.apiClient = new FreeeAPIClient(config);
    this.exportDataDir = path.join(process.cwd(), 'data_analysis', 'exported_data');
  }

  /**
   * 全データを更新
   */
  async updateAllData(params: {
    company_id: string;
    start_year?: number;
    start_month?: number;
    include_partners?: boolean;
    include_account_items?: boolean;
    include_trial_balance?: boolean;
  }) {
    try {
      const results = {
        updated_files: [] as string[],
        removed_files: [] as string[],
        statistics: {} as any
      };

      // 出力ディレクトリを確保
      if (!fs.existsSync(this.exportDataDir)) {
        fs.mkdirSync(this.exportDataDir, { recursive: true });
      }

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      // 1. 勘定科目マスタを更新
      if (params.include_account_items !== false) {
        const accountFile = await this.updateAccountItems(params.company_id, today);
        results.updated_files.push(accountFile);
      }

      // 2. 取引先マスタを更新
      if (params.include_partners !== false) {
        const partnersFile = await this.updatePartners(params.company_id, today);
        results.updated_files.push(partnersFile);
      }

      // 3. 試算表データを更新
      if (params.include_trial_balance !== false) {
        const trialBalanceFile = await this.updateTrialBalance(
          params.company_id,
          today,
          params.start_year || 2024,
          params.start_month || 1
        );
        results.updated_files.push(trialBalanceFile);
      }

      // 4. 古いファイルを削除
      results.removed_files = this.cleanupOldFiles(today);

      // 5. 統計情報を収集
      results.statistics = this.getDataStatistics();

      return {
        success: true,
        message: "データの更新が完了しました",
        results,
        export_directory: this.exportDataDir
      };

    } catch (error) {
      throw new Error(`データ更新エラー: ${error}`);
    }
  }

  /**
   * 勘定科目マスタを更新
   */
  private async updateAccountItems(companyId: string, dateStr: string): Promise<string> {
    const response = await this.apiClient.request('GET', 'account_items', {
      company_id: companyId
    });

    const csvData = [
      ['勘定科目ID', '勘定科目名', '勘定科目コード', '大分類', '大分類2', '中分類', '小分類', 
       '勘定科目カテゴリ', 'カテゴリID', 'グループ名', '税区分', '作成日時', '更新日時']
    ];

    for (const item of response.account_items) {
      const categories = item.categories || [];
      csvData.push([
        item.id || '',
        item.name || '',
        item.code || '',
        categories[0] || '',
        categories[1] || '',
        categories[2] || '',
        categories[3] || '',
        item.account_category || '',
        item.account_category_id || '',
        item.group_name || '',
        item.tax_code || '',
        item.created_at || '',
        item.updated_at || ''
      ]);
    }

    const filename = `account_items_hierarchy_${dateStr}.csv`;
    const filepath = path.join(this.exportDataDir, filename);
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    return filename;
  }

  /**
   * 取引先マスタを更新
   */
  private async updatePartners(companyId: string, dateStr: string): Promise<string> {
    const response = await this.apiClient.request('GET', 'partners', {
      company_id: companyId,
      limit: 1000
    });

    const csvData = [
      ['取引先ID', '取引先名', '取引先コード', '取引先カテゴリ', '郵便番号', '住所', '電話番号', 
       'FAX番号', 'メールアドレス', '代表者名', '敬称', '振込先口座名', '支払条件ID', '作成日時', '更新日時']
    ];

    for (const partner of response.partners) {
      csvData.push([
        partner.id || '',
        partner.name || '',
        partner.code || '',
        partner.partner_doc_setting_id || '',
        partner.zipcode || '',
        partner.address || '',
        partner.phone || '',
        partner.fax || '',
        partner.email || '',
        partner.contact_name || '',
        partner.title || '',
        partner.bank_account_info || '',
        partner.payment_term_id || '',
        partner.created_at || '',
        partner.updated_at || ''
      ]);
    }

    const filename = `partners_${dateStr}.csv`;
    const filepath = path.join(this.exportDataDir, filename);
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    return filename;
  }

  /**
   * 完全な試算表データ（PL + BS）を更新
   */
  private async updateTrialBalance(
    companyId: string,
    dateStr: string,
    startYear: number,
    startMonth: number
  ): Promise<string> {
    // 勘定科目情報を取得してマッピング
    const accountItemsResponse = await this.apiClient.request('GET', 'account_items', {
      company_id: companyId
    });

    const accountMapping: { [key: string]: any } = {};
    for (const item of accountItemsResponse.account_items) {
      accountMapping[item.id] = {
        name: item.name,
        category: item.account_category || '',
        categories: item.categories || []
      };
    }

    const csvData = [
      ['開始日', '終了日', '勘定科目名', '勘定科目ID', '勘定科目カテゴリ',
       '期首残高', '借方金額', '貸方金額', '期末残高', '構成比',
       '内訳名', '内訳ID', '内訳期首残高', '内訳借方金額', '内訳貸方金額',
       '内訳期末残高', '内訳構成比', '試算表タイプ']
    ];

    // 現在の日付まで月次でループ
    const currentDate = new Date();
    let processDate = new Date(startYear, startMonth - 1, 1);

    while (processDate <= currentDate) {
      const year = processDate.getFullYear();
      const month = processDate.getMonth() + 1;
      const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      // PL試算表を取得
      try {
        const plResponse = await this.apiClient.request('GET', 'reports/trial_pl', {
          company_id: companyId,
          start_date: startDateStr,
          end_date: endDateStr,
          breakdown_display_type: 'partner'
        });

        if (plResponse.trial_pl?.balances) {
          for (const balance of plResponse.trial_pl.balances) {
            if (!balance.total_line && balance.account_item_name) {
              const accountInfo = accountMapping[balance.account_item_id] || {};

              const baseRow = [
                startDateStr,
                endDateStr,
                balance.account_item_name,
                balance.account_item_id || '',
                accountInfo.category || '',
                balance.opening_balance || 0,
                balance.debit_amount || 0,
                balance.credit_amount || 0,
                balance.closing_balance || 0,
                balance.composition_ratio || 0
              ];

              if (balance.breakdowns && balance.breakdowns.length > 0) {
                for (const breakdown of balance.breakdowns) {
                  csvData.push([
                    ...baseRow,
                    breakdown.name || '未選択',
                    breakdown.id || 0,
                    breakdown.opening_balance || 0,
                    breakdown.debit_amount || 0,
                    breakdown.credit_amount || 0,
                    breakdown.closing_balance || 0,
                    breakdown.composition_ratio || 0,
                    'PL'
                  ]);
                }
              } else {
                csvData.push([
                  ...baseRow,
                  '未選択',
                  0,
                  baseRow[5], // 期首残高
                  baseRow[6], // 借方金額
                  baseRow[7], // 貸方金額
                  baseRow[8], // 期末残高
                  baseRow[9], // 構成比
                  'PL'
                ]);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`PL試算表取得エラー (${startDateStr}):`, error);
      }

      // BS試算表を取得
      try {
        const bsResponse = await this.apiClient.request('GET', 'reports/trial_bs', {
          company_id: companyId,
          start_date: startDateStr,
          end_date: endDateStr,
          breakdown_display_type: 'partner'
        });

        if (bsResponse.trial_bs?.balances) {
          for (const balance of bsResponse.trial_bs.balances) {
            if (!balance.total_line && balance.account_item_name) {
              const accountInfo = accountMapping[balance.account_item_id] || {};

              const baseRow = [
                startDateStr,
                endDateStr,
                balance.account_item_name,
                balance.account_item_id || '',
                accountInfo.category || '',
                balance.opening_balance || 0,
                balance.debit_amount || 0,
                balance.credit_amount || 0,
                balance.closing_balance || 0,
                balance.composition_ratio || 0
              ];

              if (balance.breakdowns && balance.breakdowns.length > 0) {
                for (const breakdown of balance.breakdowns) {
                  csvData.push([
                    ...baseRow,
                    breakdown.name || '未選択',
                    breakdown.id || 0,
                    breakdown.opening_balance || 0,
                    breakdown.debit_amount || 0,
                    breakdown.credit_amount || 0,
                    breakdown.closing_balance || 0,
                    breakdown.composition_ratio || 0,
                    'BS'
                  ]);
                }
              } else {
                csvData.push([
                  ...baseRow,
                  '未選択',
                  0,
                  baseRow[5], // 期首残高
                  baseRow[6], // 借方金額
                  baseRow[7], // 貸方金額
                  baseRow[8], // 期末残高
                  baseRow[9], // 構成比
                  'BS'
                ]);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`BS試算表取得エラー (${startDateStr}):`, error);
      }

      // 次の月へ
      processDate.setMonth(processDate.getMonth() + 1);
    }

    const filename = `complete_monthly_trial_balance_${dateStr}.csv`;
    const filepath = path.join(this.exportDataDir, filename);
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    return filename;
  }

  /**
   * 古いファイルを削除
   */
  private cleanupOldFiles(currentDateStr: string): string[] {
    const removedFiles: string[] = [];
    
    if (!fs.existsSync(this.exportDataDir)) {
      return removedFiles;
    }

    const files = fs.readdirSync(this.exportDataDir);
    const filePatterns = [
      'account_items_hierarchy_',
      'partners_',
      'complete_monthly_trial_balance_'
    ];

    for (const file of files) {
      for (const pattern of filePatterns) {
        if (file.startsWith(pattern) && !file.includes(currentDateStr)) {
          const filepath = path.join(this.exportDataDir, file);
          fs.unlinkSync(filepath);
          removedFiles.push(file);
          break;
        }
      }
    }

    return removedFiles;
  }

  /**
   * データ統計情報を取得
   */
  private getDataStatistics(): any {
    const stats: any = {
      files: [],
      total_size: 0
    };

    if (!fs.existsSync(this.exportDataDir)) {
      return stats;
    }

    const files = fs.readdirSync(this.exportDataDir);
    
    for (const file of files) {
      const filepath = path.join(this.exportDataDir, file);
      const fileStats = fs.statSync(filepath);
      
      stats.files.push({
        name: file,
        size: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime
      });
      
      stats.total_size += fileStats.size;
    }

    return stats;
  }

  /**
   * クイックデータ更新（最新3ヶ月のみ）
   */
  async quickUpdate(companyId: string) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    return await this.updateAllData({
      company_id: companyId,
      start_year: threeMonthsAgo.getFullYear(),
      start_month: threeMonthsAgo.getMonth() + 1,
      include_partners: true,
      include_account_items: true,
      include_trial_balance: true
    });
  }
}

// MCPツール用のスキーマ定義
export const DataUpdateSchema = z.object({
  company_id: z.string().describe('会社ID'),
  start_year: z.number().optional().describe('試算表データの開始年（デフォルト: 2024）'),
  start_month: z.number().min(1).max(12).optional().describe('試算表データの開始月（デフォルト: 1）'),
  include_partners: z.boolean().optional().describe('取引先マスタを含める（デフォルト: true）'),
  include_account_items: z.boolean().optional().describe('勘定科目マスタを含める（デフォルト: true）'),
  include_trial_balance: z.boolean().optional().describe('試算表データを含める（デフォルト: true）')
});

export const QuickUpdateSchema = z.object({
  company_id: z.string().describe('会社ID')
});