import { z } from 'zod';
import { FreeeAPIClient } from './api-client.js';
import { FreeeConfig } from './types.js';

/**
 * 経費申請管理ツール
 * freeeの経費申請APIを活用した包括的な経費管理機能
 */
export class ExpenseManager {
  private apiClient: FreeeAPIClient;

  constructor(config: FreeeConfig) {
    this.apiClient = new FreeeAPIClient(config);
  }

  /**
   * 私が承認すべき申請一覧を取得
   */
  async getMyPendingApprovals(params: {
    company_id: string;
    approver_user_id: string;
    include_details?: boolean;
  }) {
    try {
      // Step 1: 承認待ちの申請一覧を取得
      const pendingApps = await this.apiClient.request('GET', 'expense_applications', {
        company_id: params.company_id,
        status: 'pending'
      });

      // Step 2: 各申請の詳細を取得して自分が承認者かチェック
      const myApprovals = [];
      
      for (const app of pendingApps.expense_applications || []) {
        try {
          const detail = await this.apiClient.request('GET', `expense_applications/${app.id}`, {
            company_id: params.company_id
          });
          
          // 現在のステップで自分が承認者か確認
          const currentApproval = detail.expense_application.approvals?.find(
            (approval: any) => approval.step === detail.expense_application.current_step_id
          );
          
          if (currentApproval?.approver_id === parseInt(params.approver_user_id)) {
            const appData = detail.expense_application;
            myApprovals.push({
              id: appData.id,
              application_number: appData.application_number,
              applicant_name: appData.applicant_name,
              total_amount: appData.total_amount,
              application_date: appData.application_date,
              title: appData.title,
              description: appData.description,
              current_step_id: appData.current_step_id,
              urgency: this.calculateUrgency(appData),
              days_pending: this.calculateDaysPending(appData.application_date),
              ...(params.include_details && { 
                receipt_metadatum: appData.receipt_metadatum,
                expense_application_lines: appData.expense_application_lines 
              })
            });
          }
        } catch (error) {
          console.warn(`Failed to get details for expense ${app.id}:`, error);
        }
      }

      // 緊急度でソート
      myApprovals.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

      return {
        pending_approvals: myApprovals,
        total_count: myApprovals.length,
        total_amount: myApprovals.reduce((sum, app) => sum + (app.total_amount || 0), 0),
        urgency_summary: this.getUrgencySummary(myApprovals)
      };

    } catch (error) {
      throw new Error(`承認待ち取得エラー: ${error}`);
    }
  }

  /**
   * 経費申請を承認
   */
  async approveExpenseApplication(params: {
    company_id: string;
    expense_application_id: string;
    comment?: string;
  }) {
    try {
      const response = await this.apiClient.request('PUT', `expense_applications/${params.expense_application_id}/approve`, {
        company_id: params.company_id,
        comment: params.comment
      });

      return {
        success: true,
        message: '経費申請を承認しました',
        expense_application: response.expense_application
      };
    } catch (error) {
      throw new Error(`承認エラー: ${error}`);
    }
  }

  /**
   * 経費申請を却下
   */
  async rejectExpenseApplication(params: {
    company_id: string;
    expense_application_id: string;
    comment: string;
  }) {
    try {
      const response = await this.apiClient.request('PUT', `expense_applications/${params.expense_application_id}/reject`, {
        company_id: params.company_id,
        comment: params.comment
      });

      return {
        success: true,
        message: '経費申請を却下しました',
        expense_application: response.expense_application
      };
    } catch (error) {
      throw new Error(`却下エラー: ${error}`);
    }
  }

  /**
   * 経費申請を差戻し
   */
  async sendBackExpenseApplication(params: {
    company_id: string;
    expense_application_id: string;
    comment: string;
  }) {
    try {
      const response = await this.apiClient.request('PUT', `expense_applications/${params.expense_application_id}/feedback`, {
        company_id: params.company_id,
        comment: params.comment
      });

      return {
        success: true,
        message: '経費申請を差戻しました',
        expense_application: response.expense_application
      };
    } catch (error) {
      throw new Error(`差戻しエラー: ${error}`);
    }
  }

  /**
   * 私の経費申請一覧を取得
   */
  async getMyExpenseApplications(params: {
    company_id: string;
    status?: string;
    start_application_date?: string;
    end_application_date?: string;
    offset?: number;
    limit?: number;
  }) {
    try {
      const response = await this.apiClient.request('GET', 'expense_applications', {
        company_id: params.company_id,
        status: params.status,
        start_application_date: params.start_application_date,
        end_application_date: params.end_application_date,
        offset: params.offset || 0,
        limit: params.limit || 100
      });

      const applications = response.expense_applications || [];
      
      return {
        expense_applications: applications.map((app: any) => ({
          ...app,
          status_label: this.getStatusLabel(app.status),
          days_since_application: this.calculateDaysPending(app.application_date)
        })),
        total_count: applications.length,
        status_summary: this.getStatusSummary(applications)
      };
    } catch (error) {
      throw new Error(`申請一覧取得エラー: ${error}`);
    }
  }

  /**
   * 経費申請統計を取得
   */
  async getExpenseStatistics(params: {
    company_id: string;
    start_date?: string;
    end_date?: string;
    group_by?: 'month' | 'category' | 'applicant';
  }) {
    try {
      const allExpenses = await this.apiClient.request('GET', 'expense_applications', {
        company_id: params.company_id,
        start_application_date: params.start_date,
        end_application_date: params.end_date,
        limit: 1000
      });

      const applications = allExpenses.expense_applications || [];
      
      return {
        total_applications: applications.length,
        total_amount: applications.reduce((sum: number, app: any) => sum + (app.total_amount || 0), 0),
        average_amount: applications.length > 0 ? 
          applications.reduce((sum: number, app: any) => sum + (app.total_amount || 0), 0) / applications.length : 0,
        status_breakdown: this.groupByStatus(applications),
        monthly_trend: this.getMonthlyTrend(applications),
        category_breakdown: this.getCategoryBreakdown(applications),
        top_applicants: this.getTopApplicants(applications)
      };
    } catch (error) {
      throw new Error(`統計取得エラー: ${error}`);
    }
  }

  /**
   * 一括承認（条件付き）
   */
  async bulkApproveExpenses(params: {
    company_id: string;
    approver_user_id: string;
    max_amount?: number;
    applicant_names?: string[];
    comment?: string;
  }) {
    try {
      // 承認対象を取得
      const pendingApprovals = await this.getMyPendingApprovals({
        company_id: params.company_id,
        approver_user_id: params.approver_user_id
      });

      // 条件でフィルタリング
      let targets = pendingApprovals.pending_approvals;
      
      if (params.max_amount) {
        targets = targets.filter(app => app.total_amount <= params.max_amount);
      }
      
      if (params.applicant_names && params.applicant_names.length > 0) {
        targets = targets.filter(app => 
          params.applicant_names!.includes(app.applicant_name)
        );
      }

      // 一括承認実行
      const results = [];
      for (const app of targets) {
        try {
          const result = await this.approveExpenseApplication({
            company_id: params.company_id,
            expense_application_id: app.id.toString(),
            comment: params.comment || '一括承認'
          });
          results.push({ ...result, application: app });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error.message, 
            application: app 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return {
        total_processed: results.length,
        success_count: successCount,
        fail_count: failCount,
        total_amount_approved: results
          .filter(r => r.success)
          .reduce((sum, r) => sum + r.application.total_amount, 0),
        results
      };
    } catch (error) {
      throw new Error(`一括承認エラー: ${error}`);
    }
  }

  /**
   * 緊急度を計算
   */
  private calculateUrgency(expense: any): 'high' | 'medium' | 'low' {
    const daysSinceApplication = this.calculateDaysPending(expense.application_date);
    const amount = expense.total_amount || 0;
    
    if (daysSinceApplication > 3 || amount > 50000) return 'high';
    if (daysSinceApplication > 1 || amount > 20000) return 'medium';
    return 'low';
  }

  /**
   * 申請からの経過日数を計算
   */
  private calculateDaysPending(applicationDate: string): number {
    const appDate = new Date(applicationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - appDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 緊急度サマリーを取得
   */
  private getUrgencySummary(approvals: any[]) {
    return {
      high: approvals.filter(a => a.urgency === 'high').length,
      medium: approvals.filter(a => a.urgency === 'medium').length,
      low: approvals.filter(a => a.urgency === 'low').length
    };
  }

  /**
   * ステータスラベルを取得
   */
  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': '下書き',
      'pending': '申請中',
      'approved': '承認済み',
      'rejected': '却下',
      'feedback': '差戻し'
    };
    return labels[status] || status;
  }

  /**
   * ステータス別サマリーを取得
   */
  private getStatusSummary(applications: any[]) {
    const summary: { [key: string]: { count: number; amount: number } } = {};
    
    applications.forEach(app => {
      const status = app.status || 'unknown';
      if (!summary[status]) {
        summary[status] = { count: 0, amount: 0 };
      }
      summary[status].count++;
      summary[status].amount += app.total_amount || 0;
    });
    
    return summary;
  }

  /**
   * ステータス別グループ化
   */
  private groupByStatus(applications: any[]) {
    return applications.reduce((acc: any, app: any) => {
      const status = app.status || 'unknown';
      if (!acc[status]) acc[status] = [];
      acc[status].push(app);
      return acc;
    }, {});
  }

  /**
   * 月次トレンドを取得
   */
  private getMonthlyTrend(applications: any[]) {
    const monthlyData: { [key: string]: { count: number; amount: number } } = {};
    
    applications.forEach(app => {
      const month = app.application_date?.substring(0, 7) || 'unknown';
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].amount += app.total_amount || 0;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  /**
   * カテゴリ別内訳を取得
   */
  private getCategoryBreakdown(applications: any[]) {
    // 実際の実装では expense_application_lines から詳細を分析
    return applications.reduce((acc: any, app: any) => {
      const category = app.title || 'その他';
      if (!acc[category]) acc[category] = { count: 0, amount: 0 };
      acc[category].count++;
      acc[category].amount += app.total_amount || 0;
      return acc;
    }, {});
  }

  /**
   * 申請者上位を取得
   */
  private getTopApplicants(applications: any[]) {
    const applicantData: { [key: string]: { count: number; amount: number } } = {};
    
    applications.forEach(app => {
      const name = app.applicant_name || 'unknown';
      if (!applicantData[name]) {
        applicantData[name] = { count: 0, amount: 0 };
      }
      applicantData[name].count++;
      applicantData[name].amount += app.total_amount || 0;
    });
    
    return Object.entries(applicantData)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));
  }
}

// MCPツール用のスキーマ定義
export const PendingApprovalsSchema = z.object({
  company_id: z.string().describe('会社ID'),
  approver_user_id: z.string().describe('承認者のユーザーID'),
  include_details: z.boolean().optional().describe('詳細情報を含める（デフォルト: false）')
});

export const ApproveExpenseSchema = z.object({
  company_id: z.string().describe('会社ID'),
  expense_application_id: z.string().describe('経費申請ID'),
  comment: z.string().optional().describe('承認コメント')
});

export const RejectExpenseSchema = z.object({
  company_id: z.string().describe('会社ID'),
  expense_application_id: z.string().describe('経費申請ID'),
  comment: z.string().describe('却下理由（必須）')
});

export const SendBackExpenseSchema = z.object({
  company_id: z.string().describe('会社ID'),
  expense_application_id: z.string().describe('経費申請ID'),
  comment: z.string().describe('差戻し理由（必須）')
});

export const MyExpenseApplicationsSchema = z.object({
  company_id: z.string().describe('会社ID'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'feedback']).optional().describe('申請ステータス'),
  start_application_date: z.string().optional().describe('申請開始日（YYYY-MM-DD）'),
  end_application_date: z.string().optional().describe('申請終了日（YYYY-MM-DD）'),
  offset: z.number().optional().describe('オフセット'),
  limit: z.number().optional().describe('取得件数制限')
});

export const ExpenseStatisticsSchema = z.object({
  company_id: z.string().describe('会社ID'),
  start_date: z.string().optional().describe('集計開始日（YYYY-MM-DD）'),
  end_date: z.string().optional().describe('集計終了日（YYYY-MM-DD）'),
  group_by: z.enum(['month', 'category', 'applicant']).optional().describe('グループ化方式')
});

export const BulkApproveSchema = z.object({
  company_id: z.string().describe('会社ID'),
  approver_user_id: z.string().describe('承認者のユーザーID'),
  max_amount: z.number().optional().describe('承認上限金額'),
  applicant_names: z.array(z.string()).optional().describe('対象申請者名'),
  comment: z.string().optional().describe('一括承認コメント')
});