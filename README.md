# Freee MCP Scalar

> **🤖 Claudeをプロフェッショナルな会計士に変身させる**
> 
> freee会計APIとClaude AIを繋ぐ、ゼロ設定セットアップ。自然な日本語で会計について話しかけるだけで、Claudeが複雑なAPI操作を自動で処理します。

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0%20%2B%20PKCE-green)](https://oauth.net/2/)
[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-brightgreen)](https://nodejs.org/)

## 🎯 **なぜこれが重要なのか**

| 従来のワークフロー | Freee MCP Scalar使用時 |
|----------------------|----------------------|
| 🔄 freeeに手動ログイン → 画面操作 → エクスポート → 分析 | 💬 「1月の取引先別PLを見せて」 |
| ⏰ 月次レポート作成に2時間 | ⚡ 5分で自動生成 |
| 🧠 APIエンドポイントと認証を覚える必要 | 🗣️ 自然な日本語でリクエスト |
| 🐛 OAuth、トークン、レート制限を自分で処理 | ✅ ゼロ設定、自動処理 |
| 📊 手動でデータ分析 | 🤖 AI搭載の洞察 |

### 💡 **実際の魔法**

```
👤 「山田商事に10万円の請求書を作って」
🤖 Claudeが自動で：
   ✓ 「山田商事」からpartner IDを検索
   ✓ 適切なフォーマットで請求書作成
   ✓ 請求書番号と詳細を返却

👤 「期限切れの未払い請求書を見せて」
🤖 Claudeが自動で：
   ✓ 全ての請求書を照会
   ✓ 支払い状況と期限でフィルタリング
   ✓ 分析と次のアクションを提案

👤 「今月の経費と予算を比較して」
🤖 Claudeが自動で：
   ✓ 試算表データを取得
   ✓ 経費カテゴリを分析
   ✓ 洞察付きの比較レポートを作成
```

## 🚀 機能

### ✅ 完全なAPI対応
- **30以上のfreee APIエンドポイント** をMCPツールとして提供
- **Zodバリデーション** による自動ツール生成
- **OAuth 2.0 + PKCE** による安全な認証
- **永続化ストレージ** による自動トークンリフレッシュ
- **指数バックオフ** によるレート制限対応
- **包括的なエラーハンドリング**

### 🛠 コアAPI
- **事業所 (Companies)** - 会社情報の管理
- **取引 (Deals)** - 収入・支出取引の作成・管理・削除
- **請求書 (Invoices)** - 請求書の作成・更新・削除・一覧取得
- **振替伝票 (Manual Journals)** - 仕訳の作成・管理・削除
- **勘定科目 (Account Items)** - 勘定科目の作成・更新・削除
- **取引先 (Partners)** - 顧客・仕入先の管理
- **試算表 (Trial Balance)** - PL・BS試算表の取得
- **経費 (Expenses)** - 経費申請の管理

### 📊 追加API
- **品目 (Items)** - 商品・サービスカタログ
- **税区分 (Taxes)** - 税コードと税率
- **セグメント (Segments)** - 部門・プロジェクト
- **金融機関 (Banks)** - 金融機関連携
- **レポート (Reports)** - 各種財務レポート

## 🚀 **5分でセットアップ**

### **ステップ1: クローン＆インストール** ⬇️
```bash
git clone https://github.com/masatokaneko/freee-mcp-scalar.git
cd freee-mcp-scalar
npm install
```

### **ステップ2: freee認証情報を取得** 🔑
1. [freee開発者コンソール](https://app.secure.freee.co.jp/developers/applications)にアクセス
2. 新しいアプリケーションを作成
3. リダイレクトURIを設定: `http://127.0.0.1:8080/callback`
4. `Client ID` と `Client Secret` をコピー

### **ステップ3: 環境設定** ⚙️
```bash
cp auth/.env.example .env
```
`.env`に認証情報を設定:
```env
FREEE_CLIENT_ID=your_client_id_here
FREEE_CLIENT_SECRET=your_client_secret_here
```

### **ステップ4: ワンクリック認証** 🔐
```bash
npm run auth
```
> 自動でブラウザが開く → freeeにログイン → トークンが安全に保存 ✅

### **ステップ5: 起動＆接続** 🚀
```bash
npm run build
npm start
```

### **ステップ6: Claude Desktopに追加** 🤖
`claude_desktop_config.json`に追加:
```json
{
  "mcpServers": {
    "freee": {
      "command": "node",
      "args": ["/absolute/path/to/freee-mcp-scalar/dist/index.js"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### **🎉 すぐに使い始められます！**
```
💬 「今月の売上を見せて」
💬 「事務用品の経費報告を作成して」
💬 「未払いの請求書を全部リストアップして」
💬 「取引先の売上ランキングを作って」
```

## 🔧 設定

### Claude Desktop連携
Claude Desktop設定ファイル (`claude_desktop_config.json`) に追加:

```json
{
  "mcpServers": {
    "freee": {
      "command": "node",
      "args": ["/path/to/freee-mcp-scalar/dist/index.js"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id"
      }
    }
  }
}
```

### 利用可能な環境変数
```env
# 必須
FREEE_CLIENT_ID=               # freeeアプリのクライアントID
FREEE_CLIENT_SECRET=           # freeeアプリのクライアントシークレット

# オプション
FREEE_COMPANY_ID=              # デフォルトの会社ID
FREEE_REDIRECT_URI=            # カスタムリダイレクトURI (デフォルト: http://127.0.0.1:8080/callback)
FREEE_CALLBACK_PORT=           # カスタムコールバックポート (デフォルト: 8080)
FREEE_BASE_URL=                # カスタム認証ベースURL
FREEE_API_URL=                 # カスタムAPIベースURL
```

## 🚀 新機能：月次推移表自動作成

### 📊 **包括的な月次推移表ツール**

财务诸表の標準順序に従った月次推移表を自動作成する強力なツールセットが追加されました：

#### **利用可能なツール**

1. **`create_monthly_trend_report`** - 完全版月次推移表
2. **`create_quick_monthly_report`** - 簡易版（過去N ヶ月）
3. **`create_bs_trend_report`** - BS特化版
4. **`create_pl_trend_report`** - PL特化版

#### **自然言語での使用例**
```
💬 「2024年12月から2025年5月の月次推移表を作成してください」
🤖 → 完全な月次推移表を自動生成

💬 「過去半年の財務サマリーを見せて」  
🤖 → 6ヶ月間の推移表を迅速に作成

💬 「BSの月次推移を分析したい」
🤖 → 貸借対照表項目のみの推移表を生成
```

#### **会計ルール遵守**
- ✅ **PL項目**: 貸借差額（貸方-借方）の推移表 
- ✅ **BS項目**: 各月末残高の推移表
- ✅ **財務諸表標準順序**: 資産→負債→純資産
- ✅ **勘定科目コード順**: 各カテゴリ内で整理

#### **自動ファイル出力**
- JSON: `~/freee_monthly_reports/monthly_trend_report_YYYY-MM-DD.json`
- CSV: `~/freee_monthly_reports/monthly_trend_summary_YYYY-MM-DD.csv`

## 📋 利用可能なMCPツール

### 会社管理
- `get_companies` - アクセス可能な会社一覧
- `get_company` - 会社詳細の取得

### 取引管理
- `get_deals` - フィルタ付き取引一覧
- `create_deal` - 収入・支出取引の作成
- `get_invoices` - フィルタ付き請求書一覧
- `create_invoice` - 新規請求書の作成
- `get_manual_journals` - 振替伝票一覧
- `create_manual_journal` - 仕訳の作成

### マスタデータ
- `get_partners` - 顧客・仕入先一覧
- `get_account_items` - 勘定科目一覧
- `get_items` - 商品・サービスカタログ
- `get_taxes` - 税コードと税率
- `get_segments` - 部門・プロジェクト
- `get_banks` - 対応金融機関

### レポート
- `get_trial_pl` - PL試算表
- `get_trial_bs` - BS試算表
- `get_expense_applications` - 経費レポート

## 💼 **実際のビジネス活用例**

### **📊 月次決算を簡単に**
```
👤 「2024年3月の月次決算レポートを作成して」

🤖 Claudeの回答:
📈 2024年3月 財務サマリー
├── 売上: ¥12,450,000 (前月比+15%)
├── 費用: ¥8,200,000 (前月比-5%) 
├── 純利益: ¥4,250,000 (前月比+45%)
└── 売上トップ3の取引先:
    1. ABC株式会社: ¥3,200,000
    2. XYZ有限会社: ¥2,800,000
    3. DEF商事: ¥1,900,000

⚠️  要対応事項:
• 期限切れ請求書5件 (合計: ¥850,000)
• 3月の家賃費用が未計上
```

### **🧾 スマート請求書管理**
```
👤 「今月問題のある請求書があるかチェックして」

🤖 Claudeの回答:
🔍 請求書ヘルスチェック - 2024年11月

✅ 健全: 45件の請求書 (¥18,200,000)
⚠️  要注意: 8件の請求書
├── 期限切れ(30日超): 3件 (¥420,000)
├── 高額(50万円超): 2件
└── 税区分未設定: 3件

📋 推奨アクション:
1. 山田商事に¥180,000の督促連絡
2. 請求書#INV-1023, #INV-1029の税設定を確認
```

### **💰 経費分析とコントロール**
```
👤 「今四半期で予算オーバーしているカテゴリはある？」

🤖 Claudeの回答:
📊 2024年Q3 経費分析

🔴 予算オーバー:
├── 旅費交通費: ¥450,000 (予算の150%)
├── 広告宣伝費: ¥320,000 (予算の125%)

🟡 要監視:
├── 事務用品費: ¥89,000 (予算の95%)

✅ 良好:
├── 水道光熱費: ¥180,000 (予算の75%)
├── ソフトウェア費: ¥240,000 (予算の80%)

💡 洞察:
• 海外展開による旅費増加
• マーケティングROI: 1円投資で8.2円の売上
```

### **🔄 自動化ワークフロー例**
```
👤 「月次の取引先パフォーマンス追跡を設定して」

🤖 Claudeが自動分析を作成:
📈 取引先パフォーマンスダッシュボード
├── 売上トレンド分析
├── 支払い行動スコアリング
├── 成長機会の特定
└── リスク評価アラート

👤 「税務申告用のデータを準備して」

🤖 Claudeが生成:
📋 税務申告準備パッケージ
├── カテゴリ別経費サマリー
├── 税率別売上内訳
├── 損金・益金項目の分類
└── 必要な裏付け書類リスト
```

## 🔐 セキュリティ機能

### 認証
- **OAuth 2.0 + PKCE** による強化されたセキュリティ
- **自動トークンリフレッシュ** (90日間のリフレッシュトークンライフサイクル)
- **暗号化対応** による安全なトークン保存
- **CSRF保護** (stateパラメータ検証)

### API セキュリティ
- **Zodスキーマ** による入力値検証
- **指数バックオフ** によるレート制限対応
- **情報漏洩防止** のためのエラーサニタイゼーション
- **TLS暗号化** による全通信の保護

### 開発セキュリティ
- **環境変数の分離**
- **シークレット管理** のベストプラクティス
- **全操作の監査ログ**
- **適切なエラーハンドリング**

## 🛠 開発

### コマンド
```bash
npm run dev          # ホットリロード付き開発
npm run build        # TypeScriptからJavaScriptへビルド
npm run validate     # ビルドなしでの型チェック
npm run lint         # ESLintコード解析
npm run test         # テストスイート実行
npm run auth         # インタラクティブ認証
```

### プロジェクト構造
```
freee-mcp-scalar/
├── src/
│   ├── types.ts           # TypeScript型定義
│   ├── auth.ts            # OAuth 2.0 + PKCE認証
│   ├── api-client.ts      # リトライ機能付きFreee APIクライアント
│   ├── mcp-server.ts      # MCPサーバー実装
│   └── index.ts           # メインエントリーポイント
├── bin/
│   └── freee_authenticate # 認証用CLIスクリプト
├── mcp/                   # レガシーYAMLテンプレート（参考用）
├── auth/                  # 認証ドキュメント
└── dist/                  # ビルド済みJavaScriptファイル
```

## 📚 ドキュメント

- **[OAuth ガイド](auth/oauth_instructions.md)** - 完全なOAuth 2.0セットアップ
- **[トークン管理](auth/token_refresh_guide.md)** - リフレッシュトークンの取り扱い
- **[実装例](auth/implementation_examples.md)** - コード例
- **[セキュリティガイド](auth/security_best_practices.md)** - セキュリティベストプラクティス

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. テスト付きで変更を実装
4. 全テストが通ることを確認
5. プルリクエストを提出

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🔗 リンク

- [freee API ドキュメント](https://developer.freee.co.jp/reference/accounting/reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/chat)

## 🆚 **直接API vs MCP比較**

<table>
<tr>
<th width="50%">🔧 従来の直接API開発</th>
<th width="50%">🚀 Freee MCP Scalar</th>
</tr>
<tr>
<td>

```javascript
// 複雑なOAuth設定
const oauth = new OAuth2Client(/*...*/);
const tokens = await oauth.getTokens(/*...*/);

// 手動トークンリフレッシュロジック
if (isExpired(tokens)) {
  tokens = await refreshTokens(/*...*/);
}

// エラーハンドリング付きの生API呼び出し
try {
  const response = await fetch('/api/1/deals', {
    headers: { 
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_id: companyId,
      issue_date: '2024-01-15',
      type: 'expense',
      // ... 複雑なペイロード
    })
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      // レート制限の処理
      await sleep(calculateBackoff());
      // リトライロジック...
    }
  }
  
  const data = await response.json();
  // 手動バリデーション...
} catch (error) {
  // エラーハンドリング...
}
```

**結果**: 1つの取引に50行以上のボイラープレート

</td>
<td>

```
👤 「山田商事に事務所家賃5万円の経費取引を
    1月15日付けで作成して」

🤖 完了！取引#TXN-001を作成しました
    ✓ 取引先: 山田商事 (ID: 1001)  
    ✓ 勘定科目: 地代家賃 (6001)
    ✓ 金額: ¥50,000
    ✓ 日付: 2024-01-15
    ✓ ステータス: 投稿済み
```

**結果**: 自然言語 → 即座に実行

</td>
</tr>
<tr>
<td>

⏰ **開発時間**: 2-3日  
🧠 **学習コスト**: OAuth、API仕様書、エラー処理  
🔧 **メンテナンス**: トークン管理、レート制限、リトライ  
🐛 **デバッグ**: 複雑なAPI相互作用  
📊 **データ分析**: 手動処理が必要  

</td>
<td>

⏰ **セットアップ時間**: 5分  
🧠 **学習コスト**: 自然言語のみ  
🔧 **メンテナンス**: ゼロ - 完全自動化  
🐛 **デバッグ**: AIが問題を説明  
📊 **データ分析**: AI搭載の洞察機能  

</td>
</tr>
</table>

## ✨ **結論**

> **freeeのAPIを覚えるのではなく、Claudeにあなたのビジネス言語を教える**

- 📈 **10倍高速な開発** - OAuth不要、ボイラープレート不要、API仕様書不要
- 🤖 **AI搭載の洞察** - Claudeが会計データを理解
- 🔒 **エンタープライズ級セキュリティ** - プロダクション対応認証
- 🚀 **即座のデプロイ** - 既存のClaude Desktop設定で動作
- 💼 **ビジネス対応** - 単なるAPI呼び出しではなく、実際の会計ワークフロー

## 🔒 **データプライバシーと安全性**

### 🛡️ **実際のFreeeデータ保護**

このリポジトリは**実際のFreeeデータをGitから完全に除外**する設計になっています：

```
freee-mcp-scalar/
├── examples/           # ✅ サンプルコード（Gitにコミット）
│   ├── sample_*.py    # 汎用的なテンプレート
│   └── README.md      # 使用方法ガイド
├── data_analysis/     # ❌ 実際のデータ（Gitから除外）
│   ├── get_*.py      # 実際のデータ取得スクリプト
│   └── extract_*.py  # 実際のデータ抽出スクリプト
└── .gitignore        # 自動データ保護設定
```

### 🔐 **自動保護機能**

- **認証情報**: `.env`, `tokens.json` は自動除外
- **実データ**: `get_*.py`, `extract_*.py` など実際のデータを含むスクリプトは自動除外
- **出力ファイル**: `*.csv`, `*.xlsx`, `*.json` は自動除外
- **分析ディレクトリ**: `data_analysis/` 全体が自動除外

### 💡 **安全なワークフロー**

1. **開発**: サンプルコード (`examples/`) を参考に学習
2. **実分析**: 実際のデータ分析は `data_analysis/` で実行
3. **改善**: MCPサーバーの機能改善のみをコミット
4. **共有**: 実データは除外、機能のみを安全に共有

## ⚠️ 重要な注意事項

- **🔐 セキュリティ最優先** - トークンは `~/.config/freee-mcp/tokens.json` に暗号化して安全に保存
- **🚦 スマートレート制限** - 自動バックオフとリトライ処理
- **🔄 自動リフレッシュ** - 90日間のトークンライフサイクルを自動管理
- **📋 プロダクション対応** - 包括的なエラーハンドリングとログ機能
- **🛡️ データプライバシー** - 実際のFreeeデータは自動的にGitから除外
- **🌍 オープンソース** - MITライセンス、コミュニティへの貢献歓迎

---

**🎉 今すぐ会計ワークフローを変革しましょう - 役に立ったらぜひ ⭐ してください！**  
**❤️ freee開発者コミュニティのために作成**