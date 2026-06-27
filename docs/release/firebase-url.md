# Firebase Hosting 公開 URL

| 項目 | 値 |
|------|-----|
| 公開URL | https://myhome-loanplan.web.app |
| Firebase プロジェクト | myhome-loanplan |
| 最終デプロイ | 2026年6月28日（Sprint 6 再デプロイ） |
| デプロイ対象 | `dist/`（`npm run build` で生成） |
| 動作確認 | HTTP 200 |

## 補足
- Sprint 6 のビルドを再デプロイ済み。
- `npm run build` → `firebase deploy --only hosting` により公開。
- アップロードファイル数: 3（index.html / index-*.css / index-*.js）。
