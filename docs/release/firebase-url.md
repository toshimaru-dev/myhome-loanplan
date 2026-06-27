# Firebase Hosting 公開 URL

| 項目 | 値 |
|------|-----|
| 公開URL | https://myhome-loanplan.web.app |
| Firebase プロジェクト | myhome-loanplan |
| 最終デプロイ | 2026年6月27日（Sprint 5: 単一共有ドキュメント方式） |
| デプロイ対象 | `dist/`（`npm run build` で生成） |
| 動作確認 | HTTP 200 |

## 補足
- Sprint 5 のビルド（localStorage 廃止・`shared/main` 共有モデル）を再デプロイ済み。
- `firebase deploy --only hosting` により公開。
