# Claude Memory

- このプロジェクトはFreee会計APIと連携し、MCPにより試算表や請求書、取引先情報などを取得・操作します。
- 会社名・部門・科目・取引先の辞書は `shared/id_dictionary.yaml` を参照。
- 試算表取得では breakdown_display_type: partner を指定。
- partner名 → IDの変換には `resolve_partner.yaml` を使用。