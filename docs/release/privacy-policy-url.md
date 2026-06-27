# プライバシーポリシー公開情報

| 項目 | 値 |
|------|-----|
| 公開URL | https://toshimaru-dev.github.io/myhome-loanplan/privacy-policy.html |
| 公開日 | 2026年6月27日 |
| 最終更新 | 2026年6月27日（Sprint 5: クラウド共有モデルへ改定） |
| プラットフォーム | GitHub Pages（main ブランチ / docs フォルダ） |
| ソースファイル | `docs/privacy-policy.html` |

## 補足
- Sprint 5 で保存方式が localStorage から Firebase Firestore の単一共有ドキュメント（`shared/main`）に変更されたため、プライバシーポリシーを改定。
  - 入力した試算データがクラウド（Google Firebase）に送信・保管される旨を明記。
  - 全利用者が同一データを共有する「共有ホワイトボード」型であり、個人情報・機密情報を入力しないよう警告を追加。
  - 第三者提供（Google Firebase の利用）に関する記載を追加。
- **要対応:** GitHub Pages は main ブランチの commit を配信するため、改定後の内容を反映するには `docs/privacy-policy.html` の変更を main に push する必要がある（未 push の状態では旧バージョンが配信される）。
