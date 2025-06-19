# 月次推移表作成MCPツール

## 概要

Freee MCP Scalarには、財務諸表の標準順序に従った月次推移表を自動作成する包括的なツールが含まれています。これらのツールは、様々なレベルの詳細度とカスタマイズに対応しています。

## 利用可能なツール

### 1. `create_monthly_trend_report` (完全版)

**説明**: 完全な月次推移表を作成。BS項目は期末残高、PL項目は貸借差額で表示。

**パラメータ**:
- `company_id` (string): 会社ID
- `start_year` (number): 開始年
- `start_month` (number): 開始月 (1-12)
- `end_year` (number): 終了年
- `end_month` (number): 終了月 (1-12)
- `output_format` (optional): 'csv' | 'json'
- `include_details` (optional): boolean

**使用例**:
```javascript
// 2024年1月から2025年5月の完全な月次推移表
{
  "company_id": "1356167",
  "start_year": 2024,
  "start_month": 1,
  "end_year": 2025,
  "end_month": 5,
  "output_format": "json"
}
```

### 2. `create_quick_monthly_report` (簡易版)

**説明**: 指定した月数分の最新月次推移表を迅速に作成。

**パラメータ**:
- `company_id` (string): 会社ID
- `months` (number): 遡る月数 (1-24、デフォルト: 6)

**使用例**:
```javascript
// 過去6ヶ月の月次推移表
{
  "company_id": "1356167",
  "months": 6
}
```

### 3. `create_bs_trend_report` (BS特化)

**説明**: 貸借対照表項目のみに特化した月次推移表。

**パラメータ**:
- `company_id` (string): 会社ID
- `start_year` (number): 開始年
- `start_month` (number): 開始月 (1-12)
- `end_year` (number): 終了年
- `end_month` (number): 終了月 (1-12)

**使用例**:
```javascript
// 2024年12月から2025年5月のBS推移表
{
  "company_id": "1356167",
  "start_year": 2024,
  "start_month": 12,
  "end_year": 2025,
  "end_month": 5
}
```

### 4. `create_pl_trend_report` (PL特化)

**説明**: 損益計算書項目のみに特化した月次推移表。

**パラメータ**: BS特化版と同じ

## レスポンス形式

### 完全版レスポンス
```json
{
  "bs_report": [
    {
      "account_id": "215534999",
      "account_name": "現金",
      "account_code": "1001",
      "major_category": "資産",
      "major_category2": "流動資産",
      "middle_category": "現金・預金",
      "periods": {
        "2024-12-01": 1000000,
        "2025-01-01": 1200000,
        "2025-02-01": 950000
      }
    }
  ],
  "pl_report": [
    {
      "account_id": "215535000",
      "account_name": "売上高",
      "account_code": "4001",
      "account_category": "売上高",
      "periods": {
        "2024-12-01": 5000000,
        "2025-01-01": 5200000,
        "2025-02-01": 4800000
      }
    }
  ],
  "summary": [
    {
      "period": "2024-12-01",
      "revenues": 5000000,
      "expenses": 3000000,
      "operating_profit": 2000000,
      "total_assets": 10000000,
      "total_liabilities": 3000000,
      "total_equity": 7000000
    }
  ],
  "metadata": {
    "period": "2024年12月 - 2025年5月",
    "bs_accounts": 50,
    "pl_accounts": 38,
    "created_at": "2025-06-19T10:30:00.000Z"
  }
}
```

## 財務諸表の表示順序

### BS（貸借対照表）の順序
1. **資産の部**
   - 流動資産: 現金・預金 → 売上債権 → 棚卸資産 → その他流動資産
   - 固定資産: 有形固定資産 → 無形固定資産 → 投資その他の資産
   - 繰延資産

2. **負債の部**
   - 流動負債: 仕入債務 → その他流動負債
   - 固定負債

3. **純資産の部**
   - 株主資本: 資本金 → 資本剰余金 → 利益剰余金 → 自己株式
   - 評価・換算差額等
   - 新株予約権

### PL（損益計算書）の順序
1. 売上高
2. 売上原価（当期商品仕入）
3. 販売費及び一般管理費
4. 営業外収益
5. 営業外費用
6. 特別利益
7. 特別損失
8. 法人税等

## 会計ルール

- **PL項目**: 貸借差額（貸方 - 借方）で表示
  - 正の値 = 収益
  - 負の値 = 費用
- **BS項目**: 期末残高で表示
- **勘定科目コード順**: 各カテゴリ内で昇順にソート

## 自然言語での使用例

### Claude Desktopでの使用
```
「2024年12月から2025年5月の月次推移表を作成してください」
→ create_monthly_trend_report が自動実行

「過去半年の財務サマリーを見せて」
→ create_quick_monthly_report が自動実行

「BSの月次推移を分析したい」
→ create_bs_trend_report が自動実行
```

## ファイル出力

- JSONファイル: `~/freee_monthly_reports/monthly_trend_report_YYYY-MM-DD.json`
- CSVファイル: `~/freee_monthly_reports/monthly_trend_summary_YYYY-MM-DD.csv`

## エラーハンドリング

- API認証エラー
- 指定期間のデータ不足
- 勘定科目マスタの取得エラー
- ファイル書き込みエラー

全てのエラーは適切なエラーメッセージとともに返されます。