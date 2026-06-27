# Firebase Hosting URL

> 状態: **未デプロイ（ブロッカーあり）**

| 項目 | 値 |
|------|-----|
| 予定プロジェクト ID | `myhome-loanplan-<自動採番>` |
| 表示名 | MyHome LoanPlan |
| 公開ディレクトリ | `dist` |
| 設定ファイル | `firebase.json`（生成済み） |

## ブロッカー
Firebase プロジェクトの作成が **Google Cloud 利用規約の未承諾** により失敗しました。

```
Error: Callers must accept Terms of Service
```

- ログイン中のアカウント: `toshimaru.dev@gmail.com`
- 原因: このアカウントで Google Cloud / Firebase の利用規約が未承諾。

## 解決手順（ユーザー対応）
1. ブラウザで <https://console.firebase.google.com/> を開き、`toshimaru.dev@gmail.com` でログイン。
2. 「プロジェクトを作成」を一度実行し、利用規約（Terms of Service）に同意する。
   - もしくは <https://console.cloud.google.com/> にアクセスし、表示される利用規約に同意する。
3. 同意後、以下を実行してデプロイを完了する。

```bash
bash scripts/create-firebase-project.sh "MyHome LoanPlan" "" "dist"
npm run build
firebase deploy --only hosting
```

4. デプロイ後に表示される `https://<project-id>.web.app` が公開 URL。
