# 使用例とサンプルコード

このディレクトリには、Freee MCP Scalarの使用例やサンプルコードを配置します。

## ⚠️ 重要な注意事項

**実際のFreeeデータを含むファイルはGitにコミットしないでください**

## 推奨ディレクトリ構造

```
freee-mcp-scalar/
├── examples/           # サンプルコード（Gitにコミット）
│   ├── sample_*.py    # ダミーデータを使った例
│   └── templates/     # テンプレートファイル
├── data_analysis/     # 実際のデータ分析（Gitにコミットしない）
│   ├── get_*.py      # 実際のデータ取得スクリプト
│   ├── extract_*.py  # 実際のデータ抽出スクリプト
│   └── reports/      # 生成されたレポート
└── output/           # 出力ファイル（Gitにコミットしない）
    ├── *.csv
    ├── *.xlsx
    └── *.json
```

## サンプルコードの作成方法

1. **実際のデータ取得スクリプト**を`data_analysis/`に配置
2. **汎用的なサンプル**を`examples/`に配置
3. サンプルではダミーデータや仮想的な例を使用

## .gitignore設定

以下のパターンは自動的に除外されます：
- `get_*.py`
- `extract_*.py` 
- `search_*.py`
- `debug_*.py`
- `*.csv`, `*.xlsx`, `*.json`
- `data_analysis/`
- `output/`

## 安全なワークフロー

1. 実際のデータ分析は`data_analysis/`で実行
2. コード改善があれば、一般化して`examples/`にサンプル作成
3. MCPサーバー本体のコード修正をコミット
4. サンプルコードのみをコミット（実データは除外）