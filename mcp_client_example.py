#!/usr/bin/env python3
"""
Example: How to call Freee MCP Server tools programmatically
This shows how you can integrate MCP calls into your own applications.
"""

import subprocess
import json
import os

class FreeeMCPClient:
    """Simple client for calling Freee MCP Server tools"""
    
    def __init__(self, mcp_server_path="/Users/kanekomasato/freee-mcp-scalar"):
        self.mcp_server_path = mcp_server_path
    
    def call_tool(self, tool_name, arguments=None):
        """Call an MCP tool and return the parsed result"""
        
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments or {}
            }
        }
        
        try:
            # Start the MCP server process
            process = subprocess.Popen(
                ['node', 'dist/index.js'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=self.mcp_server_path
            )
            
            # Send the request
            input_data = json.dumps(request) + '\n'
            stdout, stderr = process.communicate(input=input_data, timeout=30)
            
            # Parse the response
            lines = stdout.strip().split('\n')
            for line in lines:
                if line.strip().startswith('{"result":'):
                    response = json.loads(line)
                    if 'result' in response and 'content' in response['result']:
                        # Extract and parse the content
                        content = response['result']['content'][0]['text']
                        return json.loads(content)
            
            return None
            
        except Exception as e:
            print(f"Error calling MCP tool {tool_name}: {e}")
            return None
    
    def get_companies(self):
        """Get list of companies"""
        return self.call_tool("get_companies")
    
    def get_account_items(self, company_id, base_date=None):
        """Get account items for a company"""
        args = {"company_id": str(company_id)}
        if base_date:
            args["base_date"] = base_date
        return self.call_tool("get_account_items", args)
    
    def get_partners(self, company_id, keyword=None, limit=None):
        """Get partners for a company"""
        args = {"company_id": str(company_id)}
        if keyword:
            args["keyword"] = keyword
        if limit:
            args["limit"] = limit
        return self.call_tool("get_partners", args)
    
    def get_trial_pl(self, company_id, start_date, end_date):
        """Get P&L trial balance"""
        args = {
            "company_id": str(company_id),
            "start_date": start_date,
            "end_date": end_date
        }
        return self.call_tool("get_trial_pl", args)

# Example usage
def main():
    print("🤖 Freee MCP Client Example")
    print("=" * 40)
    
    # Create MCP client
    client = FreeeMCPClient()
    
    # Get companies
    print("📋 Getting companies...")
    companies_data = client.get_companies()
    
    if companies_data and 'companies' in companies_data:
        companies = companies_data['companies']
        print(f"✅ Found {len(companies)} companies")
        
        # Use the first company
        main_company = companies[0]
        company_id = main_company['id']
        company_name = main_company['display_name']
        
        print(f"🏢 Working with: {company_name} (ID: {company_id})")
        print()
        
        # Example: Get account items
        print("📊 Getting account items...")
        account_items = client.get_account_items(company_id)
        if account_items and 'account_items' in account_items:
            print(f"✅ Found {len(account_items['account_items'])} account items")
            
            # Show first few account items
            for item in account_items['account_items'][:3]:
                print(f"   • {item['name']} (ID: {item['id']})")
        else:
            print("❌ No account items found")
        
        print()
        
        # Example: Get partners
        print("🤝 Getting partners...")
        partners = client.get_partners(company_id, limit=5)
        if partners and 'partners' in partners:
            print(f"✅ Found partners (showing first 5)")
            for partner in partners['partners'][:5]:
                print(f"   • {partner['name']} (ID: {partner['id']})")
        else:
            print("❌ No partners found")
        
        return company_id
    else:
        print("❌ Failed to get companies")
        return None

if __name__ == "__main__":
    main()