#!/usr/bin/env python3
"""
Freee MCP Scalar - 月次推移表作成デモンストレーション
pandasを使わないシンプル版
"""

def simulate_freee_mcp_execution():
    """Freee MCP Scalarの実行をシミュレート"""
    
    print("🤖 Freee MCP Scalar - 月次推移表作成デモ")
    print("=" * 60)
    print()
    print("👤 ユーザー: 「勘定科目別で2025年1月から5月の月次推移表を作ってください」")
    print()
    print("🔄 Claude + MCP実行中...")
    print("   ✓ get_companies - 会社情報取得")
    print("   ✓ get_account_items - 勘定科目一覧取得") 
    print("   ✓ get_trial_pl (2025-01-01 to 2025-01-31) - 1月PL試算表取得")
    print("   ✓ get_trial_pl (2025-02-01 to 2025-02-28) - 2月PL試算表取得")
    print("   ✓ get_trial_pl (2025-03-01 to 2025-03-31) - 3月PL試算表取得")
    print("   ✓ get_trial_pl (2025-04-01 to 2025-04-30) - 4月PL試算表取得")
    print("   ✓ get_trial_pl (2025-05-01 to 2025-05-31) - 5月PL試算表取得")
    print("   ✓ データ統合・分析・レポート生成中...")
    print()
    
    # シミュレートされたfreeeデータ
    monthly_data = {
        "1月": {
            "売上高": 12500000,
            "売上原価": 7500000,
            "地代家賃": 500000,
            "給与手当": 2800000,
            "旅費交通費": 85000,
            "通信費": 45000,
            "消耗品費": 25000,
            "広告宣伝費": 150000
        },
        "2月": {
            "売上高": 13200000,
            "売上原価": 7920000,
            "地代家賃": 500000,
            "給与手当": 2800000,
            "旅費交通費": 120000,
            "通信費": 47000,
            "消耗品費": 30000,
            "広告宣伝費": 180000
        },
        "3月": {
            "売上高": 11800000,
            "売上原価": 7080000,
            "地代家賃": 500000,
            "給与手当": 2800000,
            "旅費交通費": 95000,
            "通信費": 48000,
            "消耗品費": 22000,
            "広告宣伝費": 160000
        },
        "4月": {
            "売上高": 14100000,
            "売上原価": 8460000,
            "地代家賃": 500000,
            "給与手当": 2950000,
            "旅費交通費": 140000,
            "通信費": 49000,
            "消耗品費": 35000,
            "広告宣伝費": 200000
        },
        "5月": {
            "売上高": 13700000,
            "売上原価": 8220000,
            "地代家賃": 500000,
            "給与手当": 2950000,
            "旅費交通費": 110000,
            "通信費": 51000,
            "消耗品費": 28000,
            "広告宣伝費": 170000
        }
    }
    
    print("🤖 Claudeの回答:")
    print()
    print("📈 勘定科目別月次推移表（2025年1月〜5月）")
    print("🏢 対象会社: サンプル株式会社")
    print()
    
    # ヘッダー行
    print("┌" + "─" * 14 + "┬" + "─" * 12 + "┬" + "─" * 12 + "┬" + "─" * 12 + "┬" + "─" * 12 + "┬" + "─" * 12 + "┐")
    print("│{:^14}│{:^12}│{:^12}│{:^12}│{:^12}│{:^12}│".format("勘定科目", "1月", "2月", "3月", "4月", "5月"))
    print("├" + "─" * 14 + "┼" + "─" * 12 + "┼" + "─" * 12 + "┼" + "─" * 12 + "┼" + "─" * 12 + "┼" + "─" * 12 + "┤")
    
    # データ行
    accounts = ["売上高", "売上原価", "地代家賃", "給与手当", "旅費交通費", "通信費", "消耗品費", "広告宣伝費"]
    
    for account in accounts:
        print("│{:14}│{:>11,}│{:>11,}│{:>11,}│{:>11,}│{:>11,}│".format(
            account,
            monthly_data["1月"][account],
            monthly_data["2月"][account], 
            monthly_data["3月"][account],
            monthly_data["4月"][account],
            monthly_data["5月"][account]
        ))
    
    print("└" + "─" * 14 + "┴" + "─" * 12 + "┴" + "─" * 12 + "┴" + "─" * 12 + "┴" + "─" * 12 + "┴" + "─" * 12 + "┘")
    
    print()
    print("💡 主要な分析:")
    
    # 売上分析
    jan_revenue = monthly_data["1月"]["売上高"]
    may_revenue = monthly_data["5月"]["売上高"]
    revenue_change = (may_revenue - jan_revenue) / jan_revenue * 100
    print(f"• 売上高: {revenue_change:+.1f}% (1月→5月)")
    
    # 最高・最低売上月
    revenues = {month: data["売上高"] for month, data in monthly_data.items()}
    max_month = max(revenues, key=revenues.get)
    min_month = min(revenues, key=revenues.get)
    print(f"• 売上最高月: {max_month} (¥{revenues[max_month]:,})")
    print(f"• 売上最低月: {min_month} (¥{revenues[min_month]:,})")
    
    # 固定費
    print(f"• 地代家賃: 全期間安定 (¥{monthly_data['1月']['地代家賃']:,}/月)")
    
    # 給与変化
    jan_salary = monthly_data["1月"]["給与手当"]
    apr_salary = monthly_data["4月"]["給与手当"]
    if apr_salary > jan_salary:
        salary_increase = apr_salary - jan_salary
        print(f"• 給与手当: 4月から増加 (+¥{salary_increase:,})")
    
    # 旅費分析
    travels = {month: data["旅費交通費"] for month, data in monthly_data.items()}
    max_travel_month = max(travels, key=travels.get)
    print(f"• 旅費交通費: {max_travel_month}が最大 (¥{travels[max_travel_month]:,})")
    
    print()
    print("📈 成長率トレンド (前月比):")
    
    months = ["1月", "2月", "3月", "4月", "5月"]
    for i in range(1, len(months)):
        prev_month = months[i-1]
        curr_month = months[i]
        prev_revenue = monthly_data[prev_month]["売上高"]
        curr_revenue = monthly_data[curr_month]["売上高"]
        growth_rate = (curr_revenue - prev_revenue) / prev_revenue * 100
        print(f"• {curr_month}: {growth_rate:+.1f}%")
    
    print()
    print("🔍 売上原価率:")
    for month in months:
        revenue = monthly_data[month]["売上高"]
        cogs = monthly_data[month]["売上原価"]
        cogs_rate = cogs / revenue * 100
        print(f"• {month}: {cogs_rate:.1f}%")
    
    print()
    print("📁 利用可能なエクスポート形式:")
    print("• CSV形式 (.csv)")
    print("• Excel形式 (.xlsx)")
    print("• PDF形式 (.pdf)")
    print("• Google Sheets連携")
    
    print()
    print("🔄 追加分析オプション:")
    print("• 前年同期比較")
    print("• 予算対実績分析")
    print("• 部門別内訳表示")
    print("• グラフ・チャート生成")
    
    print()
    print("✨ このレポートが「勘定科目別で2025年1月から5月の月次推移表を作って」")
    print("   という一言で自動生成されました！")

if __name__ == "__main__":
    simulate_freee_mcp_execution()