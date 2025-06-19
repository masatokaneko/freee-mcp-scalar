#!/usr/bin/env python3
"""
月次推移表作成のサンプルコード
実際のFreeeデータではなく、MCPの使用方法を示すテンプレート
"""

import subprocess
import json
import os

def call_mcp_tool(tool_name, params=None):
    """MCPツールを呼び出すヘルパー関数"""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": params or {}
        }
    }
    
    try:
        # 環境変数を設定
        env = os.environ.copy()
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env[key] = value
        
        # MCPサーバーとのプロセス通信
        process = subprocess.Popen(
            ['npx', 'tsx', 'src/index.ts'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )
        
        # JSON-RPCリクエストを送信
        request_json = json.dumps(request) + '\n'
        stdout, stderr = process.communicate(input=request_json, timeout=30)
        
        if stderr:
            print(f"MCP Server Log: {stderr.strip()}")
        
        # レスポンスを解析
        try:
            response = json.loads(stdout.strip())
            if 'result' in response:
                content = response['result'].get('content', [])
                if content and content[0].get('type') == 'text':
                    return json.loads(content[0]['text'])
            return response.get('result')
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析エラー: {e}")
            return None
            
    except Exception as e:
        print(f"❌ MCP通信エラー: {e}")
        return None

def create_sample_monthly_report():
    """サンプル月次推移表作成"""
    print("📊 サンプル月次推移表作成")
    print("=" * 50)
    
    # 1. 会社情報を取得
    print("🏢 会社情報を取得中...")
    companies_data = call_mcp_tool("get_companies")
    
    if companies_data and 'companies' in companies_data:
        company = companies_data['companies'][0]
        company_id = str(company['id'])
        print(f"✓ 対象会社: {company.get('name', 'N/A')} (ID: {company_id})")
    else:
        print("❌ 会社情報の取得に失敗しました")
        return
    
    # 2. 勘定科目一覧を取得
    print("\n📋 勘定科目一覧を取得中...")
    account_items_data = call_mcp_tool("get_account_items", {
        "company_id": company_id
    })
    
    if account_items_data and 'account_items' in account_items_data:
        print(f"✓ {len(account_items_data['account_items'])} 個の勘定科目を取得")
    else:
        print("❌ 勘定科目の取得に失敗しました")
        return
    
    # 3. 試算表データを取得（サンプル期間）
    print("\n📊 試算表データを取得中...")
    trial_pl_data = call_mcp_tool("get_trial_pl", {
        "company_id": company_id,
        "start_date": "2025-01-01",
        "end_date": "2025-01-31"
    })
    
    if trial_pl_data and 'trial_pl' in trial_pl_data:
        balances = trial_pl_data['trial_pl'].get('balances', [])
        print(f"✓ {len(balances)} 項目の試算表データを取得")
        
        # 個別勘定科目のみを抽出
        individual_items = [
            item for item in balances 
            if not item.get('total_line', False) and item.get('account_item_name')
        ]
        
        print(f"個別勘定科目: {len(individual_items)} 項目")
        
        # 主要な勘定科目を表示（サンプル）
        print("\n主要な勘定科目（サンプル表示）:")
        for i, item in enumerate(individual_items[:5]):
            account_name = item.get('account_item_name', 'N/A')
            closing_balance = item.get('closing_balance', 0)
            print(f"  {i+1}. {account_name}: ¥{abs(closing_balance):,}")
    
    print("\n✨ サンプル月次推移表の作成が完了しました")
    print("\n💡 このサンプルコードを参考に、実際のデータ分析スクリプトを")
    print("   data_analysis/ ディレクトリに作成してください")

if __name__ == "__main__":
    create_sample_monthly_report()