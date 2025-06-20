#!/usr/bin/env python3
"""
Demo: Freee MCP Server - get_companies tool
This script demonstrates how to call the get_companies MCP tool and parse the results.
"""

import subprocess
import json
import sys
import os

def call_get_companies():
    """Call the get_companies MCP tool"""
    
    # MCP request to call get_companies
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "get_companies",
            "arguments": {}
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
            cwd='/Users/kanekomasato/freee-mcp-scalar'
        )
        
        # Send the request
        input_data = json.dumps(request) + '\n'
        
        print("🤖 Calling Freee MCP Server: get_companies")
        print("=" * 50)
        
        # Send request and get response
        stdout, stderr = process.communicate(input=input_data, timeout=30)
        
        # Process the response
        lines = stdout.strip().split('\n')
        
        # Look for the JSON response (skip authentication messages)
        for line in lines:
            if line.strip().startswith('{"result":'):
                try:
                    response = json.loads(line)
                    if 'result' in response and 'content' in response['result']:
                        # Extract the company data
                        content = response['result']['content'][0]['text']
                        company_data = json.loads(content)
                        
                        print("✅ Successfully retrieved company information!")
                        print()
                        print("📋 Companies accessible to your account:")
                        print()
                        
                        for i, company in enumerate(company_data['companies'], 1):
                            print(f"{i}. {company['display_name']}")
                            print(f"   ID: {company['id']}")
                            if company['name']:
                                print(f"   Full Name: {company['name']}")
                                print(f"   Kana: {company['name_kana']}")
                            print(f"   Company Number: {company['company_number']}")
                            print(f"   Role: {company['role']}")
                            print()
                        
                        print(f"📊 Total companies: {len(company_data['companies'])}")
                        
                        # Return the first company ID for further use
                        if company_data['companies']:
                            first_company = company_data['companies'][0]
                            print(f"💡 Main company: {first_company['display_name']} (ID: {first_company['id']})")
                            return first_company['id']
                        
                        return None
                        
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse JSON response: {e}")
                    print(f"Raw line: {line}")
        
        # If we didn't find a proper response, show what we got
        print("📤 Raw server output:")
        print(stdout)
        if stderr:
            print("⚠️  Server messages:")
            print(stderr)
            
        return None
        
    except subprocess.TimeoutExpired:
        print("❌ Request timed out")
        process.kill()
        return None
    except Exception as e:
        print(f"❌ Error calling MCP tool: {e}")
        return None

def main():
    print("🚀 Freee MCP Server Demo - Company Information")
    print("=" * 60)
    print()
    
    # Change to the project directory
    os.chdir('/Users/kanekomasato/freee-mcp-scalar')
    
    # Call get_companies
    company_id = call_get_companies()
    
    print()
    print("🎯 Next Steps:")
    print("You can now use other MCP tools with the company ID:")
    if company_id:
        print(f"• get_account_items with company_id={company_id}")
        print(f"• get_partners with company_id={company_id}")
        print(f"• get_deals with company_id={company_id}")
        print(f"• get_trial_pl with company_id={company_id}")
    print()
    print("🔧 Available MCP Tools:")
    tools = [
        "get_companies", "get_company", "get_partners", "get_account_items",
        "get_deals", "create_deal", "get_invoices", "create_invoice",
        "get_manual_journals", "create_manual_journal", "get_trial_pl",
        "get_trial_bs", "get_expense_applications", "get_taxes",
        "get_segments", "get_items", "get_banks"
    ]
    
    for i, tool in enumerate(tools, 1):
        print(f"{i:2d}. {tool}")

if __name__ == "__main__":
    main()