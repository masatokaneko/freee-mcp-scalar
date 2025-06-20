#!/usr/bin/env python3
"""
Freee MCP Scalar - 月次推移表作成デモンストレーション
実際のAPIを呼び出すとどのような結果が得られるかを示すシミュレーション
"""

import pandas as pd
import json
from datetime import datetime

def simulate_freee_api_calls():
    """実際のfreee APIが返すであろうデータをシミュレート"""
    
    # 1. 会社情報取得のシミュレート
    companies_response = {
        "companies": [
            {
                "id": 123456,
                "name": "サンプル株式会社", 
                "display_name": "サンプル会社"
            }
        ]
    }
    
    # 2. 勘定科目取得のシミュレート
    account_items_response = {
        "account_items": [
            {"id": 4000, "name": "売上高", "account_category": "revenue"},
            {"id": 5000, "name": "売上原価", "account_category": "cost_of_sales"},
            {"id": 6001, "name": "地代家賃", "account_category": "expense"},
            {"id": 6002, "name": "給与手当", "account_category": "expense"},
            {"id": 6003, "name": "旅費交通費", "account_category": "expense"},
            {"id": 6004, "name": "通信費", "account_category": "expense"},
            {"id": 6005, "name": "消耗品費", "account_category": "expense"},
            {"id": 6006, "name": "広告宣伝費", "account_category": "expense"},
        ]
    }
    
    # 3. 各月のPL試算表データシミュレート
    monthly_trial_data = {
        "2025-01": {
            "trial_pl": {
                "balances": [
                    {"account_item_id": 4000, "account_item_name": "売上高", "credit_amount": 12500000},
                    {"account_item_id": 5000, "account_item_name": "売上原価", "debit_amount": 7500000},
                    {"account_item_id": 6001, "account_item_name": "地代家賃", "debit_amount": 500000},
                    {"account_item_id": 6002, "account_item_name": "給与手当", "debit_amount": 2800000},
                    {"account_item_id": 6003, "account_item_name": "旅費交通費", "debit_amount": 85000},
                    {"account_item_id": 6004, "account_item_name": "通信費", "debit_amount": 45000},
                    {"account_item_id": 6005, "account_item_name": "消耗品費", "debit_amount": 25000},
                    {"account_item_id": 6006, "account_item_name": "広告宣伝費", "debit_amount": 150000},
                ]
            }
        },
        "2025-02": {
            "trial_pl": {
                "balances": [
                    {"account_item_id": 4000, "account_item_name": "売上高", "credit_amount": 13200000},
                    {"account_item_id": 5000, "account_item_name": "売上原価", "debit_amount": 7920000},
                    {"account_item_id": 6001, "account_item_name": "地代家賃", "debit_amount": 500000},
                    {"account_item_id": 6002, "account_item_name": "給与手当", "debit_amount": 2800000},
                    {"account_item_id": 6003, "account_item_name": "旅費交通費", "debit_amount": 120000},
                    {"account_item_id": 6004, "account_item_name": "通信費", "debit_amount": 47000},
                    {"account_item_id": 6005, "account_item_name": "消耗品費", "debit_amount": 30000},
                    {"account_item_id": 6006, "account_item_name": "広告宣伝費", "debit_amount": 180000},
                ]
            }
        },
        "2025-03": {
            "trial_pl": {
                "balances": [
                    {"account_item_id": 4000, "account_item_name": "売上高", "credit_amount": 11800000},
                    {"account_item_id": 5000, "account_item_name": "売上原価", "debit_amount": 7080000},
                    {"account_item_id": 6001, "account_item_name": "地代家賃", "debit_amount": 500000},
                    {"account_item_id": 6002, "account_item_name": "給与手当", "debit_amount": 2800000},
                    {"account_item_id": 6003, "account_item_name": "旅費交通費", "debit_amount": 95000},
                    {"account_item_id": 6004, "account_item_name": "通信費", "debit_amount": 48000},
                    {"account_item_id": 6005, "account_item_name": "消耗品費", "debit_amount": 22000},
                    {"account_item_id": 6006, "account_item_name": "広告宣伝費", "debit_amount": 160000},
                ]
            }
        },
        "2025-04": {
            "trial_pl": {
                "balances": [
                    {"account_item_id": 4000, "account_item_name": "売上高", "credit_amount": 14100000},
                    {"account_item_id": 5000, "account_item_name": "売上原価", "debit_amount": 8460000},
                    {"account_item_id": 6001, "account_item_name": "地代家賃", "debit_amount": 500000},
                    {"account_item_id": 6002, "account_item_name": "給与手当", "debit_amount": 2950000},
                    {"account_item_id": 6003, "account_item_name": "旅費交通費", "debit_amount": 140000},
                    {"account_item_id": 6004, "account_item_name": "通信費", "debit_amount": 49000},
                    {"account_item_id": 6005, "account_item_name": "消耗品費", "debit_amount": 35000},
                    {"account_item_id": 6006, "account_item_name": "広告宣伝費", "debit_amount": 200000},
                ]
            }
        },
        "2025-05": {
            "trial_pl": {
                "balances": [
                    {"account_item_id": 4000, "account_item_name": "売上高", "credit_amount": 13700000},
                    {"account_item_id": 5000, "account_item_name": "売上原価", "debit_amount": 8220000},
                    {"account_item_id": 6001, "account_item_name": "地代家賃", "debit_amount": 500000},
                    {"account_item_id": 6002, "account_item_name": "給与手当", "debit_amount": 2950000},
                    {"account_item_id": 6003, "account_item_name": "旅費交通費", "debit_amount": 110000},
                    {"account_item_id": 6004, "account_item_name": "通信費", "debit_amount": 51000},
                    {"account_item_id": 6005, "account_item_name": "消耗品費", "debit_amount": 28000},
                    {"account_item_id": 6006, "account_item_name": "広告宣伝費", "debit_amount": 170000},
                ]
            }
        }
    }
    
    return companies_response, account_items_response, monthly_trial_data

def create_monthly_trend_report():
    """月次推移表を作成"""
    
    print("🤖 Freee MCP Scalar - 月次推移表作成デモ")
    print("=" * 60)
    
    # データの取得と処理
    companies, account_items, monthly_data = simulate_freee_api_calls()
    
    print(f"📊 対象期間: 2025年1月〜5月")
    print(f"🏢 会社: {companies['companies'][0]['name']}")
    print()
    
    # MCPツールの実行シミュレーション
    print("🔄 MCPツール実行中...")
    print("   ✓ get_companies - 会社情報取得")
    print("   ✓ get_account_items - 勘定科目一覧取得") 
    print("   ✓ get_trial_pl (1月) - PL試算表取得")
    print("   ✓ get_trial_pl (2月) - PL試算表取得")
    print("   ✓ get_trial_pl (3月) - PL試算表取得")
    print("   ✓ get_trial_pl (4月) - PL試算表取得")
    print("   ✓ get_trial_pl (5月) - PL試算表取得")
    print("   ✓ データ統合・分析中...")
    print()
    
    # 月次推移表の作成
    months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"]
    month_labels = ["1月", "2月", "3月", "4月", "5月"]
    
    # データフレーム作成用のデータ準備
    data_for_df = {}
    
    # 各勘定科目のデータを整理
    for account in account_items['account_items']:
        account_name = account['name']
        account_id = account['id']
        
        monthly_amounts = []
        for month in months:
            # その月のその勘定科目の金額を取得
            amount = 0
            for balance in monthly_data[month]['trial_pl']['balances']:
                if balance['account_item_id'] == account_id:
                    # 売上は貸方、その他は借方
                    if account_id == 4000:  # 売上高
                        amount = balance.get('credit_amount', 0)
                    else:
                        amount = balance.get('debit_amount', 0)
                    break
            monthly_amounts.append(amount)
        
        data_for_df[account_name] = monthly_amounts
    
    # DataFrameに変換
    df = pd.DataFrame(data_for_df, index=month_labels)
    
    print("📈 勘定科目別月次推移表")
    print("=" * 100)
    
    # 見やすい形式で出力
    for account_name in df.columns:
        print(f"{account_name:12}", end=" │ ")
        for month in month_labels:
            amount = df.loc[month, account_name]
            print(f"{amount:>12,}", end=" │ ")
        print()
    
    print("=" * 100)
    
    # 分析とインサイト
    print()
    print("💡 主要な分析:")
    
    # 売上分析
    revenue_data = df.loc[:, '売上高']
    revenue_change = (revenue_data.iloc[-1] - revenue_data.iloc[0]) / revenue_data.iloc[0] * 100
    print(f"• 売上高: {revenue_change:+.1f}% (1月比較)")
    
    # 最大・最小月の特定
    max_month = revenue_data.idxmax()
    min_month = revenue_data.idxmin()
    print(f"• 売上最高月: {max_month} (¥{revenue_data[max_month]:,})")
    print(f"• 売上最低月: {min_month} (¥{revenue_data[min_month]:,})")
    
    # 固定費の安定性
    rent_data = df.loc[:, '地代家賃']
    print(f"• 地代家賃: 全期間安定 (¥{rent_data.iloc[0]:,}/月)")
    
    # 変動費の分析
    travel_data = df.loc[:, '旅費交通費']
    travel_max = travel_data.max()
    travel_max_month = travel_data.idxmax()
    print(f"• 旅費交通費: {travel_max_month}に最大 (¥{travel_max:,})")
    
    print()
    print("📈 成長率トレンド:")
    
    # 月次成長率計算
    for i in range(1, len(month_labels)):
        prev_revenue = revenue_data.iloc[i-1]
        curr_revenue = revenue_data.iloc[i]
        growth_rate = (curr_revenue - prev_revenue) / prev_revenue * 100
        print(f"• {month_labels[i]}: {growth_rate:+.1f}% (前月比)")
    
    print()
    print("⚠️  注意点:")
    
    # 給与手当の変化をチェック
    salary_data = df.loc[:, '給与手当']
    if salary_data.iloc[-1] > salary_data.iloc[0]:
        print(f"• 給与手当が4月から増加 (¥{salary_data.iloc[0]:,} → ¥{salary_data.iloc[-1]:,})")
    
    # 売上原価率の計算
    cogs_data = df.loc[:, '売上原価']
    cogs_rate_jan = cogs_data.iloc[0] / revenue_data.iloc[0] * 100
    cogs_rate_may = cogs_data.iloc[-1] / revenue_data.iloc[-1] * 100
    print(f"• 売上原価率: {cogs_rate_jan:.1f}% (1月) → {cogs_rate_may:.1f}% (5月)")
    
    return df

def show_export_options():
    """エクスポートオプションの表示"""
    print()
    print("📁 エクスポートオプション:")
    print("• CSV形式での出力")
    print("• Excel形式での出力") 
    print("• グラフ付きPDFレポート")
    print("• Google Sheetsへの直接送信")
    
    print()
    print("🔄 追加分析オプション:")
    print("• 前年同期比較")
    print("• 予算対実績分析")
    print("• 部門別内訳")
    print("• 季節性分析")

if __name__ == "__main__":
    # メイン実行
    df = create_monthly_trend_report()
    show_export_options()
    
    print()
    print("✨ このような分析が「勘定科目別で2025年1月から5月の月次推移表を作って」")
    print("   という一言で自動生成されます！")