# Freee MCP Scalar - ツールリファレンス

## 📋 **完全なMCPツール一覧**

### 🏢 **会社管理 (Companies)**

#### `get_companies`
**説明**: アクセス可能な会社一覧を取得  
**パラメータ**: なし  
**使用例**: 
```
👤 「アクセスできる会社を教えて」
🤖 → 登録済み会社の一覧を表示
```

#### `get_company`
**説明**: 特定の会社の詳細情報を取得  
**パラメータ**:
- `company_id` (string): 会社ID

**使用例**:
```
👤 「会社の基本情報を確認して」
🤖 → 会社名、住所、代表者、事業年度等の詳細表示
```

---

### 👥 **取引先管理 (Partners)**

#### `get_partners`
**説明**: 取引先一覧を取得（検索・ページング対応）  
**パラメータ**:
- `company_id` (string): 会社ID
- `keyword` (string, optional): 検索キーワード
- `offset` (number, optional): ページングオフセット
- `limit` (number, optional): 取得件数制限

**使用例**:
```
👤 「"山田"で始まる取引先を検索して」
🤖 → 山田商事、山田工業など該当取引先を表示
```

---

### 📊 **勘定科目管理 (Account Items)**

#### `get_account_items`
**説明**: 勘定科目一覧を取得（階層構造付き）  
**パラメータ**:
- `company_id` (string): 会社ID
- `base_date` (string, optional): 基準日 (YYYY-MM-DD)

**使用例**:
```
👤 「現金関連の勘定科目を見せて」
🤖 → 現金、普通預金、当座預金等を階層表示
```

---

### 💼 **取引管理 (Deals)**

#### `get_deals`
**説明**: 取引一覧を取得（多様なフィルタ対応）  
**パラメータ**:
- `company_id` (string): 会社ID
- `partner_id` (string, optional): 取引先IDフィルタ
- `account_item_id` (string, optional): 勘定科目IDフィルタ
- `start_issue_date` (string, optional): 開始日 (YYYY-MM-DD)
- `end_issue_date` (string, optional): 終了日 (YYYY-MM-DD)
- `type` (enum, optional): 取引タイプ ('income' | 'expense')
- `offset` (number, optional): ページングオフセット
- `limit` (number, optional): 取得件数制限

**使用例**:
```
👤 「今月のABC商事との取引を表示して」
🤖 → 指定取引先との当月取引明細を表示
```

#### `create_deal`
**説明**: 新しい取引を作成  
**パラメータ**:
- `company_id` (string): 会社ID
- `issue_date` (string): 取引日 (YYYY-MM-DD)
- `type` (enum): 取引タイプ ('income' | 'expense')
- `partner_id` (number, optional): 取引先ID
- `ref_number` (string, optional): 参照番号
- `details` (array): 取引明細
  - `account_item_id` (number): 勘定科目ID
  - `amount` (number): 金額
  - `tax_code` (number, optional): 税区分
  - `description` (string, optional): 摘要

**使用例**:
```
👤 「山田商事に10万円の売上を記録して」
🤖 → 売上取引を自動作成
```

---

### 📄 **請求書管理 (Invoices)**

#### `get_invoices`
**説明**: 請求書一覧を取得  
**パラメータ**:
- `company_id` (string): 会社ID
- `partner_id` (string, optional): 取引先IDフィルタ
- `issue_date_start` (string, optional): 発行開始日
- `issue_date_end` (string, optional): 発行終了日
- `invoice_status` (string, optional): 請求書ステータス
- `offset` (number, optional): ページングオフセット
- `limit` (number, optional): 取得件数制限

**使用例**:
```
👤 「未入金の請求書を全部見せて」
🤖 → 入金待ちの請求書一覧を金額順で表示
```

#### `create_invoice`
**説明**: 新しい請求書を作成  
**パラメータ**:
- `company_id` (string): 会社ID
- `issue_date` (string): 発行日
- `partner_id` (number): 取引先ID
- `invoice_contents` (array): 請求書明細
  - `order` (number): 行順序
  - `type` (literal): 'normal'
  - `account_item_id` (number): 勘定科目ID
  - `description` (string): 商品・サービス名
  - `unit_price` (number): 単価
  - `qty` (number): 数量
  - `unit` (string, optional): 単位
  - `tax_code` (number, optional): 税区分

**使用例**:
```
👤 「ABC商事にコンサル料50万円の請求書を作成して」
🤖 → 請求書を自動作成し、請求書番号を返却
```

---

### 📋 **振替伝票管理 (Manual Journals)**

#### `get_manual_journals`
**説明**: 振替伝票一覧を取得  
**パラメータ**:
- `company_id` (string): 会社ID
- `start_issue_date` (string, optional): 開始日
- `end_issue_date` (string, optional): 終了日
- `entry_side` (enum, optional): 仕訳サイド ('debit' | 'credit')
- `offset` (number, optional): ページングオフセット
- `limit` (number, optional): 取得件数制限

#### `create_manual_journal`
**説明**: 新しい振替伝票を作成  
**パラメータ**:
- `company_id` (string): 会社ID
- `issue_date` (string): 伝票日付
- `details` (array): 仕訳明細
  - `entry_side` (enum): 借方/貸方 ('debit' | 'credit')
  - `account_item_id` (number): 勘定科目ID
  - `amount` (number): 金額
  - `partner_id` (number, optional): 取引先ID
  - `description` (string, optional): 摘要

**使用例**:
```
👤 「現金100万円を普通預金に振替える仕訳を切って」
🤖 → 振替伝票を自動作成
```

---

### 🧾 **経費申請管理 (Expense Applications)** ⭐新機能

#### `get_my_pending_approvals`
**説明**: 自分が承認者として承認待ちの経費申請一覧を取得  
**パラメータ**:
- `company_id` (string): 会社ID
- `approver_user_id` (string): 承認者のユーザーID
- `include_details` (boolean, optional): 詳細情報含む

**使用例**:
```
👤 「私が承認すべき申請を教えて」
🤖 承認待ちの申請が4件あります：
   💼 田中太郎 - 出張旅費 ¥45,000 (緊急)
   💼 佐藤花子 - 会議費 ¥12,000
   合計: ¥128,700
```

#### `approve_expense_application`
**説明**: 経費申請を承認  
**パラメータ**:
- `company_id` (string): 会社ID
- `expense_application_id` (string): 経費申請ID
- `comment` (string, optional): 承認コメント

**使用例**:
```
👤 「田中さんの出張申請を承認して」
🤖 → 該当申請を承認し、申請者に通知
```

#### `reject_expense_application`
**説明**: 経費申請を却下  
**パラメータ**:
- `company_id` (string): 会社ID
- `expense_application_id` (string): 経費申請ID
- `comment` (string): 却下理由（必須）

#### `send_back_expense_application`
**説明**: 経費申請を差戻し  
**パラメータ**:
- `company_id` (string): 会社ID
- `expense_application_id` (string): 経費申請ID
- `comment` (string): 差戻し理由（必須）

#### `get_my_expense_applications`
**説明**: 自分の経費申請一覧を取得  
**パラメータ**:
- `company_id` (string): 会社ID
- `status` (enum, optional): ステータス ('draft' | 'pending' | 'approved' | 'rejected' | 'feedback')
- `start_application_date` (string, optional): 申請開始日
- `end_application_date` (string, optional): 申請終了日
- `offset` (number, optional): オフセット
- `limit` (number, optional): 取得件数制限

**使用例**:
```
👤 「今月の経費申請状況を確認して」
🤖 申請状況サマリー：
   ✅ 承認済み: 5件 (¥125,000)
   ⏳ 申請中: 2件 (¥15,000)
   📝 下書き: 3件 (¥8,500)
```

#### `get_expense_statistics`
**説明**: 経費申請統計・トレンド分析  
**パラメータ**:
- `company_id` (string): 会社ID
- `start_date` (string, optional): 集計開始日
- `end_date` (string, optional): 集計終了日
- `group_by` (enum, optional): グループ化 ('month' | 'category' | 'applicant')

**使用例**:
```
👤 「今四半期の経費傾向を分析して」
🤖 分析レポート：
   📊 カテゴリ別: 交通費40%, 会議費20%
   📈 月次トレンド: 12月が最多
   👑 申請上位: 田中さん(¥180,000)
```

#### `bulk_approve_expenses`
**説明**: 条件付き一括承認  
**パラメータ**:
- `company_id` (string): 会社ID
- `approver_user_id` (string): 承認者ユーザーID
- `max_amount` (number, optional): 承認上限金額
- `applicant_names` (array, optional): 対象申請者名
- `comment` (string, optional): 一括承認コメント

**使用例**:
```
👤 「5万円以下の申請を一括承認して」
🤖 3件を一括承認しました：
   ✅ 田中太郎 - ¥45,000
   ✅ 佐藤花子 - ¥12,000  
   ✅ 山田次郎 - ¥3,200
```

---

### 📊 **試算表・レポート (Reports)**

#### `get_trial_pl`
**説明**: PL試算表を取得  
**パラメータ**:
- `company_id` (string): 会社ID
- `start_date` (string): 開始日
- `end_date` (string): 終了日
- `breakdown_display_type` (enum, optional): 内訳タイプ

#### `get_trial_bs`
**説明**: BS試算表を取得  
**パラメータ**: PL試算表と同じ

**使用例**:
```
👤 「今月のPLとBSを確認して」
🤖 → 損益計算書と貸借対照表を表形式で表示
```

---

### 📈 **月次推移表 (Monthly Trend Analysis)** ⭐新機能

#### `create_monthly_trend_report`
**説明**: 包括的な月次推移表を作成（財務諸表標準順序）  
**パラメータ**:
- `company_id` (string): 会社ID
- `start_year` (number): 開始年
- `start_month` (number): 開始月 (1-12)
- `end_year` (number): 終了年
- `end_month` (number): 終了月 (1-12)
- `output_format` (enum, optional): 出力形式 ('csv' | 'json')
- `include_details` (boolean, optional): 詳細情報含む

**使用例**:
```
👤 「2024年12月から2025年5月の月次推移表を作成して」
🤖 → BS期末残高推移 + PL貸借差額推移を財務諸表順序で出力
```

#### `create_quick_monthly_report`
**説明**: 簡易版月次レポート（過去N ヶ月）  
**パラメータ**:
- `company_id` (string): 会社ID
- `months` (number): 遡る月数 (1-24, デフォルト: 6)

#### `create_bs_trend_report`
**説明**: BS特化月次推移表  
**パラメータ**: 基本的な期間指定のみ

#### `create_pl_trend_report`
**説明**: PL特化月次推移表  
**パラメータ**: 基本的な期間指定のみ

---

### 💾 **データ管理 (Data Management)** ⭐新機能

#### `update_freee_data`
**説明**: exported_dataフォルダの完全更新  
**パラメータ**:
- `company_id` (string): 会社ID
- `start_year` (number, optional): 試算表開始年 (デフォルト: 2024)
- `start_month` (number, optional): 試算表開始月 (デフォルト: 1)
- `include_partners` (boolean, optional): 取引先含む (デフォルト: true)
- `include_account_items` (boolean, optional): 勘定科目含む (デフォルト: true)
- `include_trial_balance` (boolean, optional): 試算表含む (デフォルト: true)

**使用例**:
```
👤 「データを最新状態に更新して」
🤖 データ更新完了：
   ✅ 勘定科目マスタ: 更新
   ✅ 取引先マスタ: 更新  
   ✅ 月次試算表: 2024年1月〜現在まで更新
   🗑️ 古いファイル: 3件削除
```

#### `quick_update_data`
**説明**: クイックデータ更新（最新3ヶ月）  
**パラメータ**:
- `company_id` (string): 会社ID

---

### 🏪 **その他マスタデータ**

#### `get_expense_applications`
**説明**: 経費申請一覧を取得（管理者向け）

#### `get_taxes`
**説明**: 税区分一覧を取得

#### `get_segments`
**説明**: セグメント（部門・プロジェクト）一覧を取得

#### `get_items`
**説明**: 品目一覧を取得

#### `get_banks`
**説明**: 対応金融機関一覧を取得

---

## 🎯 **実用的な使用パターン**

### **📅 日次業務**
```
👤 「今日の承認待ち申請と未入金請求書を確認して」
🤖 → 承認待ち一覧 + 未入金請求書一覧を表示

👤 「緊急の申請から順番に承認して」
🤖 → 緊急度順にソートして個別承認
```

### **📊 月次業務**
```
👤 「今月の経費申請状況をサマリーして」
🤖 → ステータス別集計 + 金額分析

👤 「月次推移表を作成してファイル出力して」
🤖 → JSON/CSV形式でファイル出力
```

### **🔄 定期メンテナンス**
```
👤 「データを最新に更新してから今四半期の分析をして」
🤖 → データ更新 → 統計分析の自動実行
```

## 📝 **設定が必要な項目**

### **環境変数**
```env
FREEE_CLIENT_ID=your_client_id
FREEE_CLIENT_SECRET=your_client_secret
FREEE_COMPANY_ID=your_company_id  # デフォルト会社ID
FREEE_USER_ID=your_user_id        # 承認機能で使用
```

### **権限設定（freeeアプリ）**
- ✅ 事業所情報の取得
- ✅ 取引の参照・作成・更新・削除
- ✅ 請求書の参照・作成・更新・削除  
- ✅ 振替伝票の参照・作成・更新・削除
- ✅ 勘定科目の参照・作成・更新・削除
- ✅ 取引先の参照・作成・更新・削除
- ✅ 試算表の取得
- ✅ **経費申請の参照・承認・却下**
- ✅ 経費申請の参照
- ✅ 品目の参照
- ✅ 税区分の参照
- ✅ セグメントの参照

---

## 🚀 **総計: 36個のMCPツール**

- **基本API**: 26ツール
- **月次推移表**: 4ツール  
- **データ管理**: 2ツール
- **経費申請管理**: 7ツール（新機能）

これにより、freee会計のほぼ全ての機能をClaude AI経由で自然言語操作できます！