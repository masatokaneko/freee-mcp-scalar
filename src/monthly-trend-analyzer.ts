import { z } from 'zod';
import { FreeeAPIClient } from './api-client.js';
import { FreeeConfig } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 月次推移表作成ツール
 * freeeの試算表データから財務諸表の標準順序で月次推移表を作成
 */
export class MonthlyTrendAnalyzer {
  private apiClient: FreeeAPIClient;

  constructor(config: FreeeConfig) {
    this.apiClient = new FreeeAPIClient(config);
  }

  /**
   * 月次推移表を作成
   */
  async createMonthlyTrendReport(params: {
    company_id: string;
    start_year: number;
    start_month: number;
    end_year: number;
    end_month: number;
    output_format?: 'csv' | 'json';
    include_details?: boolean;
  }) {
    try {
      // 1. 勘定科目の階層構造を取得
      const accountItems = await this.getAccountItemsWithHierarchy(params.company_id);
      
      // 2. 試算表データを取得（PL + BS）
      const trialBalanceData = await this.getCompleteTrialBalanceData(
        params.company_id,
        params.start_year,
        params.start_month,
        params.end_year,
        params.end_month
      );

      // 3. BS項目の期末残高推移表を作成
      const bsReport = this.createBSReport(trialBalanceData, accountItems);

      // 4. PL項目の貸借差額推移表を作成
      const plReport = this.createPLReport(trialBalanceData, accountItems);

      // 5. 統合サマリーを作成
      const summary = this.createFinancialSummary(bsReport, plReport);

      const result = {
        bs_report: bsReport,
        pl_report: plReport,
        summary: summary,
        metadata: {
          period: `${params.start_year}年${params.start_month}月 - ${params.end_year}年${params.end_month}月`,
          bs_accounts: bsReport.length,
          pl_accounts: plReport.length,
          created_at: new Date().toISOString()
        }
      };

      // ファイル出力（オプション）
      if (params.output_format) {
        await this.saveReportToFile(result, params.output_format);
      }

      return result;

    } catch (error) {
      throw new Error(`月次推移表作成エラー: ${error}`);
    }
  }

  /**
   * 勘定科目の階層構造を取得
   */
  private async getAccountItemsWithHierarchy(companyId: string) {
    const response = await this.apiClient.request('GET', 'account_items', {
      company_id: companyId
    });

    return response.account_items.map((item: any) => ({
      id: item.id,
      name: item.name,
      code: item.code || '',
      category: item.account_category,
      major_category: item.categories?.[0] || '',
      major_category2: item.categories?.[1] || '',
      middle_category: item.categories?.[2] || '',
      minor_category: item.categories?.[3] || ''
    }));
  }

  /**
   * 完全な試算表データ（PL + BS）を取得
   */
  private async getCompleteTrialBalanceData(
    companyId: string,
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ) {
    const data: any[] = [];
    let currentDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0); // 月末

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      // PL試算表を取得
      const plData = await this.apiClient.request('GET', 'reports/trial_pl', {
        company_id: companyId,
        start_date: startDateStr,
        end_date: endDateStr,
        breakdown_display_type: 'partner'
      });

      if (plData.trial_pl?.balances) {
        for (const balance of plData.trial_pl.balances) {
          if (!balance.total_line && balance.account_item_name) {
            data.push({
              ...balance,
              period: startDateStr,
              report_type: 'PL'
            });
          }
        }
      }

      // BS試算表を取得
      const bsData = await this.apiClient.request('GET', 'reports/trial_bs', {
        company_id: companyId,
        start_date: startDateStr,
        end_date: endDateStr,
        breakdown_display_type: 'partner'
      });

      if (bsData.trial_bs?.balances) {
        for (const balance of bsData.trial_bs.balances) {
          if (!balance.total_line && balance.account_item_name) {
            data.push({
              ...balance,
              period: startDateStr,
              report_type: 'BS'
            });
          }
        }
      }

      // 次の月へ
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  }

  /**
   * BS期末残高推移表を作成
   */
  private createBSReport(trialBalanceData: any[], accountItems: any[]) {
    // BS項目をフィルタ
    const bsData = trialBalanceData.filter(item => item.report_type === 'BS');
    
    // 勘定科目情報をマップ
    const accountMap = new Map(accountItems.map(item => [item.id, item]));
    
    // BS表示順序定義
    const bsOrder: { [key: string]: string } = {
      // 資産の部
      '資産,流動資産,現金・預金': '01',
      '資産,流動資産,売上債権': '02',
      '資産,流動資産,棚卸資産': '03',
      '資産,流動資産,他流動資産': '04',
      '資産,固定資産,有形固定資産': '05',
      '資産,固定資産,無形固定資産': '06',
      '資産,固定資産,投資その他の資産': '07',
      '資産,繰延資産,繰延資産': '08',
      // 負債の部
      '負債及び純資産,負債,流動負債': '20',
      '負債及び純資産,負債,固定負債': '21',
      // 純資産の部
      '負債及び純資産,純資産,株主資本': '30',
      '負債及び純資産,純資産,評価・換算差額等': '31',
      '負債及び純資産,純資産,新株予約権': '32',
    };

    // 勘定科目ごとにグループ化
    const groupedData = new Map();
    
    for (const item of bsData) {
      const key = `${item.account_item_id}_${item.account_item_name}`;
      if (!groupedData.has(key)) {
        const accountInfo = accountMap.get(item.account_item_id) || {};
        groupedData.set(key, {
          account_id: item.account_item_id,
          account_name: item.account_item_name,
          account_code: accountInfo.code || '',
          major_category: accountInfo.major_category || '',
          major_category2: accountInfo.major_category2 || '',
          middle_category: accountInfo.middle_category || '',
          minor_category: accountInfo.minor_category || '',
          periods: new Map()
        });
      }
      
      groupedData.get(key).periods.set(item.period, item.closing_balance || 0);
    }

    // 結果を配列に変換してソート
    const result = Array.from(groupedData.values()).map(item => {
      const sortKey = bsOrder[`${item.major_category},${item.major_category2},${item.middle_category}`] || '99';
      return {
        ...item,
        sort_key: sortKey,
        periods: Object.fromEntries(item.periods)
      };
    });

    // ソート：表示順序 → 勘定科目コード → 勘定科目名
    result.sort((a, b) => {
      if (a.sort_key !== b.sort_key) return a.sort_key.localeCompare(b.sort_key);
      if (a.account_code !== b.account_code) {
        const codeA = parseInt(a.account_code) || 999999;
        const codeB = parseInt(b.account_code) || 999999;
        return codeA - codeB;
      }
      return a.account_name.localeCompare(b.account_name);
    });

    return result.map(item => {
      const { sort_key, ...rest } = item;
      return rest;
    });
  }

  /**
   * PL貸借差額推移表を作成
   */
  private createPLReport(trialBalanceData: any[], accountItems: any[]) {
    // PL項目をフィルタ
    const plData = trialBalanceData.filter(item => item.report_type === 'PL');
    
    // 勘定科目情報をマップ
    const accountMap = new Map(accountItems.map(item => [item.id, item]));
    
    // PL表示順序定義
    const plOrder: { [key: string]: string } = {
      '売上高': '01',
      '当期商品仕入': '02',
      '販売管理費': '03',
      '営業外収益': '04',
      '営業外費用': '05',
      '特別利益': '06',
      '特別損失': '07',
      '法人税等': '08',
    };

    // 勘定科目ごとにグループ化
    const groupedData = new Map();
    
    for (const item of plData) {
      const key = `${item.account_item_id}_${item.account_item_name}`;
      if (!groupedData.has(key)) {
        const accountInfo = accountMap.get(item.account_item_id) || {};
        groupedData.set(key, {
          account_id: item.account_item_id,
          account_name: item.account_item_name,
          account_code: accountInfo.code || '',
          account_category: accountInfo.category || '',
          periods: new Map()
        });
      }
      
      // 貸借差額を計算
      const netAmount = (item.credit_amount || 0) - (item.debit_amount || 0);
      groupedData.get(key).periods.set(item.period, netAmount);
    }

    // 結果を配列に変換してソート
    const result = Array.from(groupedData.values()).map(item => {
      const sortKey = plOrder[item.account_category] || '99';
      return {
        ...item,
        sort_key: sortKey,
        periods: Object.fromEntries(item.periods)
      };
    });

    // ソート：表示順序 → 勘定科目コード → 勘定科目名
    result.sort((a, b) => {
      if (a.sort_key !== b.sort_key) return a.sort_key.localeCompare(b.sort_key);
      if (a.account_code !== b.account_code) {
        const codeA = parseInt(a.account_code) || 999999;
        const codeB = parseInt(b.account_code) || 999999;
        return codeA - codeB;
      }
      return a.account_name.localeCompare(b.account_name);
    });

    return result.map(item => {
      const { sort_key, ...rest } = item;
      return rest;
    });
  }

  /**
   * 財務サマリーを作成
   */
  private createFinancialSummary(bsReport: any[], plReport: any[]) {
    const periods = new Set();
    
    // 全期間を取得
    [...bsReport, ...plReport].forEach(item => {
      Object.keys(item.periods).forEach(period => periods.add(period));
    });

    return Array.from(periods).sort().map(period => {
      // PL集計
      const revenues = plReport
        .filter(item => item.account_category === '売上高')
        .reduce((sum, item) => sum + (item.periods[period] || 0), 0);
      
      const expenses = plReport
        .filter(item => ['販売管理費', '当期商品仕入'].includes(item.account_category))
        .reduce((sum, item) => sum + Math.abs(item.periods[period] || 0), 0);

      // BS集計
      const assets = bsReport
        .filter(item => item.major_category === '資産')
        .reduce((sum, item) => sum + (item.periods[period] || 0), 0);
      
      const liabilities = bsReport
        .filter(item => item.major_category2 === '負債')
        .reduce((sum, item) => sum + Math.abs(item.periods[period] || 0), 0);

      const equity = bsReport
        .filter(item => item.major_category2 === '純資産')
        .reduce((sum, item) => sum + (item.periods[period] || 0), 0);

      return {
        period,
        revenues,
        expenses,
        operating_profit: revenues - expenses,
        total_assets: assets,
        total_liabilities: liabilities,
        total_equity: equity
      };
    });
  }

  /**
   * レポートをファイルに保存
   */
  private async saveReportToFile(data: any, format: 'csv' | 'json') {
    const homeDir = os.homedir();
    const outputDir = path.join(homeDir, 'freee_monthly_reports');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'json') {
      const filepath = path.join(outputDir, `monthly_trend_report_${timestamp}.json`);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
      return filepath;
    } else {
      // CSV形式での保存は簡略化（実際の実装では詳細なCSV生成を行う）
      const filepath = path.join(outputDir, `monthly_trend_summary_${timestamp}.csv`);
      const csvContent = this.convertToCSV(data.summary);
      fs.writeFileSync(filepath, csvContent, 'utf8');
      return filepath;
    }
  }

  /**
   * データをCSV形式に変換（簡易版）
   */
  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] || 0).join(','))
    ];
    
    return csvRows.join('\n');
  }
}

// MCPツール用のスキーマ定義
export const MonthlyTrendReportSchema = z.object({
  company_id: z.string().describe('会社ID'),
  start_year: z.number().describe('開始年'),
  start_month: z.number().min(1).max(12).describe('開始月'),
  end_year: z.number().describe('終了年'),
  end_month: z.number().min(1).max(12).describe('終了月'),
  output_format: z.enum(['csv', 'json']).optional().describe('出力形式'),
  include_details: z.boolean().optional().describe('詳細情報を含める')
});