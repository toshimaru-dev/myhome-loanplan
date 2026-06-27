# Sprint 5 評価結果

## 評価日時
2026-06-27

**判定:** 合格
**評価対象:** Sprint 5 — 単一共有ドキュメント方式への移行（localStorage・同期コード廃止）

## 評価方法
- `npm run dev`（Vite, http://localhost:5173/）でアプリを起動して評価した。
- Playwright MCP は本環境で未接続のため、Sprint 2〜4 と同様に **システム Chrome（149 系）を Chrome DevTools Protocol（Node 25 の global WebSocket 経由）でヘッドレス実駆動**した。React 制御 input にはネイティブ value setter + `input`/`change` イベント発火、ボタン・タブは実 `.click()`、オフライン切替は `Network.emulateNetworkConditions { offline:true/false }`（`navigator.onLine` と `online`/`offline` イベントを実際に発火）で再現した。
- **2 ブラウザ同時起動**で共有データ一致・`onSnapshot` リアルタイム反映を実検証した。
- 静的検査（`grep`）・`npm run test`（Vitest 48 ケース）・`npm run build` を併せて実施した。
- 全シナリオで `Runtime.exceptionThrown` / `console.error` を監視した。

## スコア

| 基準 | スコア | 閾値 | 判定 |
|------|--------|------|------|
| 機能完全性 | 5/5 | 4 | PASS |
| 動作安定性 | 5/5 | 4 | PASS |
| UI/UX品質 | 4/5 | 3 | PASS |
| エラーハンドリング | 5/5 | 3 | PASS |
| 回帰なし | 5/5 | 5 | PASS |
| デザイン仕様適合 | 4/5 | 3 | PASS |

**全基準が閾値以上のため Sprint 5 合格。**

## テスト結果

| シナリオ | 結果 | 備考 |
|----------|------|------|
| S5-1 初期表示（Firestore 自動読込） | PASS | 識別子入力なしで `shared/main` の物件が自動表示。物件名 input・フォーム・結果が描画される |
| S5-1/S5-6 SyncBar 非表示 | PASS | 画面に「同期コード」テキスト・コピーボタン・切替欄が一切存在しない（`hasSyncText:false, hasCopyBtn:false, switchBtn:false`） |
| S5-2 データ編集・自動同期 | PASS | 物件名「テスト物件」に変更可。物件価格 30,000,000・金利1%・期間35年で **月々支払合計 ¥90,331（64px ヒーロー）**、総借入額 ¥32,000,000、総返済額 ¥37,939,198 を表示。保存時エラー・例外なし |
| S5-2 null安全 | PASS | 物件価格を空欄にするとヒーロー数値が **「—」**（64px）に変化 |
| S5-3 諸経費5%ボタン（Sprint4 回帰） | PASS | 物件価格 40,000,000 で「5%」押下 → 諸経費が **2,000,000** にセットされ即再計算 |
| S5-3 物件追加 | PASS | 「物件を追加」で新規物件作成・選択切替 |
| S5-4 比較表示（Sprint3 回帰） | PASS | 「比較」タブで CompareTable（物件価格・総借入額・総返済額 等の行）が描画される |
| S5-5 オフラインバナー表示 | PASS | `navigator.onLine=false` で最上部に「⚠ オフライン中 — 読み取り専用」バナー表示 |
| S5-5 編集 UI 無効化 | PASS | 物件名 input が `readOnly`、「物件を追加」ボタンが `disabled` |
| S5-5 編集ブロック（状態不変） | PASS | オフライン中に物件名を外部から書き換えても state が変化しない（"物件1"→"物件1"） |
| S5-5 オフライン中の閲覧・計算継続 | PASS | 直前の計算結果（¥90,331）が表示され続け、JS 例外 0・クラッシュなし |
| S5-5 オンライン復帰 | PASS | バナー消失・`readOnly`/`disabled` 解除・編集再開（「復帰テスト」に変更可） |
| 共有データ一致（端末間） | PASS | ブラウザA が物件名を書込 → 新規に開いたブラウザB が **同じ物件名を表示**（単一 `shared/main` 共有） |
| リアルタイム反映（onSnapshot） | PASS | ブラウザB を開いたまま A が物件名変更 → **B が自動で追従更新** |
| localStorage 非依存 | PASS | アプリ動作後も `localStorage` にアプリキー（`myhome-loanplan-*`）が一切書かれない（keys=[]）。`grep` で App.tsx/firestoreStorage.ts に `localStorage` 呼び出しゼロ |

## 受け入れ基準への対応（spec.md Sprint 5）

| 受け入れ基準 | 対応 |
|---|---|
| App コードに `localStorage.getItem/setItem` が存在しない | `grep` 確認：`src/App.tsx`・`src/lib/firestoreStorage.ts` に 0 件。残る `localStorage` 参照は未使用残置の `src/lib/storage.ts`（テスト専用）のみで App から未呼び出し |
| SyncBar が画面に一切表示されない | `src/components/SyncBar.tsx` ファイル削除済み・UI に同期コード要素ゼロ |
| `getSyncId`/`saveSyncId` がコードベースに存在しない | `grep` 確認：`getSyncId`/`saveSyncId`/`generateSyncId`/`SYNC_ID` すべて 0 件 |
| 操作なしで `shared/main` を自動表示 | 起動時 `subscribeToState` が `shared/main` を購読・反映。識別子入力・ログインなし |
| 別端末で同じデータが見える | 2 ブラウザテストで一致確認（単一固定ドキュメント） |
| onSnapshot で他端末の編集が反映 | 2 ブラウザ同時テストで A の変更が B にライブ反映 |
| 追加・削除・改名・選択切替が `shared/main` に保存・再読込で保持 | `saveStateToFirestore` がドキュメント直下に `{properties,activeId}` を保存。Sprint 4 で Firestore 往復は実証済み |
| オフラインで「読み取り専用」バナー表示 | CDP offline で表示確認 |
| オフライン中は全編集操作を無効化 | ハンドラ早期 return（一次）+ `disabled`/`readOnly`/`pointer-events-none`（二次）。状態不変を確認 |
| オフライン中も閲覧・計算継続・クラッシュなし | 結果表示継続・JS 例外 0 |
| 復帰で編集再開・同期再開 | バナー消失・編集再開を確認 |
| localStorage 全消去後もデータが失われない | localStorage にアプリキーが書かれず、データ本体は `shared/main` から表示（localStorage 非依存） |
| Sprint 1〜4 機能（計算・複数物件・比較・5%）の回帰なし | すべて動作確認（下記） |

## 回帰確認（Sprint 1〜4）

| 項目 | 結果 | 判定 |
|------|------|------|
| 基本計算（30M/諸経費2M/1.0%/35年） | 通常月返済額 ¥90,331（90,000円台） | PASS |
| null安全（物件価格空欄） | ヒーロー数値「—」 | PASS |
| 複数物件・物件追加・選択切替 | 正常動作 | PASS |
| 比較タブ（CompareTable） | 正常描画 | PASS |
| 諸経費5%自動入力ボタン（オンライン時） | 40,000,000 × 5% = 2,000,000 | PASS |
| ユニットテスト | `npm run test` 48/48 合格（loanCalc 29 + storage 19） | PASS |
| 本番ビルド | `npm run build` 成功（gzip 199.95KB） | PASS |
| JS 例外 / 意味のある console.error | 全シナリオ通して 0 件（Firestore のネットワークログのみ・無害） | PASS |

計算ロジック（loanCalc）・物件管理（storage）・比較表（CompareTable）・諸経費5%ボタンは無改変で再利用され、回帰なし。同期コード共有・localStorage 永続化は spec.md 記載どおり Sprint 5 で意図的に廃止された機能であり、回帰対象外。

## デザイン仕様適合（design.md 照合）
Chrome の computed style を実測して照合：

| 項目 | design.md / progress.md 指定 | 実測値 | 判定 |
|------|------------------------------|--------|------|
| フォントファミリー | `'M PLUS Rounded 1c', sans-serif` | `"M PLUS Rounded 1c", sans-serif` | 一致 |
| 5%ボタン背景 | `#E4F6EE`（primary-light） | `rgb(228, 246, 238)` | 一致 |
| 5%ボタン文字色 | `#138A60`（primary-dark） | `rgb(19, 138, 96)` | 一致 |
| 結果ヒーロー数値 | 800 64px | 64px | 一致 |
| オフラインバナー背景 | `#6E7B73`（bg-muted、タスク指定） | 適用（最上部固定・文字白） | 一致 |

design.md にオフライン UI の固有規定はないが、progress.md に理由が明記されたうえでタスク指定の `bg-muted` トークンを使用しており、既存デザイントークンとの一貫性が保たれている。

## バグ一覧
重大なバグは検出されなかった。

| # | 重要度 | 内容 | 状態 |
|---|--------|------|------|
| — | — | なし | — |

（参考）Sprint 4 で報告した Minor #1「オフライン時の同期状態表示」は、Sprint 5 で `navigator.onLine` + `online`/`offline` イベント監視を一次ソースに採用したことで解消され、オフライン時に確実に「オフライン」バナー・状態表示へ切り替わることを確認した。

## 改善提案（任意・合否に影響しない）
- **バンドルサイズ**: firebase SDK 取り込みで単一チャンク 728KB（gzip 199.95KB）。動作上の問題はないが、将来的に `import()` による code-split で初期ロードを軽量化できる（スコープ外）。
- **未使用残置モジュール**: `src/lib/storage.ts` の `loadState`/`saveState`/`getStore` は App から未呼び出しの残置（`storage.test.ts` 依存のため温存）。spec の「App コードに localStorage アクセスなし」は満たすが、将来的にテストを `normalizeState` 等へ寄せれば残置モジュールを整理できる（任意）。

## Generator への指示
- **修正不要（Sprint 5 合格）。**
- Sprint 1〜5 すべて合格したため、本アプリは **全スプリント完了**。

## 総合判定
**合格**

**Sprint 1〜5 全スプリント合格。** `/docs/app-type.md` が `web` のため、オーケストレーターは **Step 4（Releaser: Firebase 再デプロイ・プライバシーポリシー/利用規約公開）** へ進んでよい。
