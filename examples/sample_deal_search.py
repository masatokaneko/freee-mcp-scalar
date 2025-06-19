#!/usr/bin/env python3
"""
取引検索のサンプルコード
特定の取引先や勘定科目での取引検索方法を示すテンプレート
"""

import subprocess
import json
import os

def call_mcp_tool(tool_name, params=None):
    """MCPツールを呼び出すヘルパー関数"""
    # 前のサンプルと同じ実装
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
        env = os.environ.copy()
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env[key] = value
        
        process = subprocess.Popen(
            ['npx', 'tsx', 'src/index.ts'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )
        
        request_json = json.dumps(request) + '\n'
        stdout, stderr = process.communicate(input=request_json, timeout=30)
        
        if stderr:
            print(f"MCP Server Log: {stderr.strip()}")
        
        try:
            response = json.loads(stdout.strip())
            if 'result' in response:
                content = response['result'].get('content', [])
                if content and content[0].get('type') == 'text':
                    return json.loads(content[0]['text'])
            return response.get('result')
        except json.JSONDecodeError:
            return None
            
    except Exception as e:
        print(f"❌ MCP通信エラー: {e}")
        return None

def sample_deal_search():
    """サンプル取引検索"""
    print("🔍 サンプル取引検索")
    print("=" * 40)
    
    # 1. 会社情報を取得
    companies_data = call_mcp_tool("get_companies")
    if not (companies_data and 'companies' in companies_data):
        print("❌ 会社情報の取得に失敗しました")
        return
        
    company_id = str(companies_data['companies'][0]['id'])
    
    # 2. 取引先一覧を取得（キーワード検索のサンプル）
    print("\n🔍 取引先検索のサンプル...")
    partners_data = call_mcp_tool("get_partners", {
        "company_id": company_id,
        "keyword": "サンプル",  # 実際の検索キーワードに置き換え
        "limit": 10
    })
    
    if partners_data and 'partners' in partners_data:
        partners = partners_data['partners']
        print(f"✓ {len(partners)} 件の取引先を取得")
        
        # 最初の取引先で取引検索のサンプル
        if partners:
            partner = partners[0]
            partner_id = str(partner['id'])
            partner_name = partner.get('name', 'N/A')
            
            print(f"\n📋 {partner_name} の取引検索サンプル...")
            deals_data = call_mcp_tool("get_deals", {
                "company_id": company_id,
                "partner_id": partner_id,
                "start_issue_date": "2025-01-01",
                "limit": 5
            })
            
            if deals_data and 'deals' in deals_data:
                deals = deals_data['deals']
                print(f"✓ {len(deals)} 件の取引を取得")
                
                for i, deal in enumerate(deals[:3]):  # 最大3件表示
                    print(f"  {i+1}. {deal.get('issue_date', 'N/A')}: ¥{deal.get('amount', 0):,}")
    
    # 3. 勘定科目指定での取引検索サンプル
    print("\n📊 勘定科目指定取引検索のサンプル...")
    
    # 売上高などの主要勘定科目での検索例
    account_items_data = call_mcp_tool("get_account_items", {
        "company_id": company_id
    })
    
    if account_items_data and 'account_items' in account_items_data:
        # 売上関連の勘定科目を探す
        revenue_accounts = [
            item for item in account_items_data['account_items']
            if '売上' in item.get('name', '')
        ]
        
        if revenue_accounts:
            account = revenue_accounts[0]
            account_id = str(account['id'])
            account_name = account['name']
            
            print(f"勘定科目「{account_name}」での取引検索...")
            deals_data = call_mcp_tool("get_deals", {
                "company_id": company_id,
                "account_item_id": account_id,
                "start_issue_date": "2025-01-01",
                "limit": 3
            })
            
            if deals_data and 'deals' in deals_data:
                deals = deals_data['deals']
                print(f"✓ {len(deals)} 件の取引を取得")
    
    print("\n✨ サンプル取引検索が完了しました")
    print("\n💡 このテンプレートを参考に、実際の取引先名や期間を指定して")
    print("   data_analysis/ ディレクトリで実際のデータ分析を行ってください")

if __name__ == "__main__":
    sample_deal_search()