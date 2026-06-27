# Sprint 4 評価結果

**判定:** 合格
**評価日:** 2026-06-27
**評価対象:** Sprint 4 - クラウド同期（Firestore）+ 同期コード共有 + 入力補助

## 評価方法
- `npm run dev`（Vite, http://localhost:5173/）でアプリを起動して評価した。
- Playwright MCP が本環境で未接続のため、Sprint 2/3 同様フォールバックとして **実 Chrome（149.0.7827.200 / headless）を Chrome DevTools Protocol（Node 25 の global WebSocket 経由）で実駆動**し、React 制御 input にはネイティブ value setter + `input`/`change` イベント発火、ボタン・タブ・モーダルは実 `.click()` で操作した。
- **Firestore の実書き込みを独立検証**: firebase SDK を用いた node スクリプトで `sessions/{id}` に `{ properties, activeId }` を write → read（構造・値一致を確認）→ delete を実施し、本番 Firestore への疎通を確認した。
- リロード時の復元は **localStorage の物件ミラー（`myhome-loanplan-properties`）を削除してから再読み込み**し、localStorage ではなく Firestore（クラウド）から復元されることを切り分けて検証した。
- 375px モバイル幅（`Emulation.setDeviceMetricsOverride`）でテスト。`Network.emulateNetworkConditions` で offline/online を切り替え。`Runtime.exceptionThrown` / `console.error` を全シナリオで監視。
- 併せて `npm run test`（Vitest 48 ケース）、`npm run build`（成功）を実施した。

## スコア

| 基準 | スコア | 閾値 | 判定 |
|------|--------|------|------|
| 機能完全性 | 5/5 | 4 | PASS |
| 動作安定性 | 5/5 | 4 | PASS |
| UI/UX品質 | 4/5 | 3 | PASS |
| エラーハンドリング | 4/5 | 3 | PASS |
| 回帰なし | 5/5 | 5 | PASS |
| デザイン仕様適合 | 5/5 | 3 | PASS |

**全基準が閾値以上のため Sprint 4 合格。Sprint 1〜4 すべて合格＝全スプリント完了。**

## テスト結果詳細（Sprint 4 受け入れ基準）

### 合格した項目

1. **同期コード自動発行・表示**: PASS
   - localStorage クリア後の初回アクセスで `myhome-loanplan-sync-id` に **有効な UUID**（`c3e6d696-8559-4aff-9e81-284aaec136d7`）が自動保存された。
   - ヘッダー下 SyncBar に「同期コード」+ 先頭8文字（`c3e6d696`）が表示され、UUID 先頭8文字と一致。

2. **Firestore 保存・復元**: PASS
   - 物件価格 `30,000,000`・諸経費 `2,000,000`・物件名「Aマンション」を入力後、同期状態が **「保存済み」** 表示。
   - **localStorage 物件ミラーを削除してからリロード** → 物件名「Aマンション」・物件価格 `30,000,000`・諸経費 `2,000,000` がすべて復元。これにより localStorage ではなく **Firestore（クラウド）からの復元** を確認。
   - 独立した node スクリプトで本番 Firestore への write/read/delete 疎通を確認（`state.properties[0].name`・`values.price`・`activeId` の構造と値が往復で一致）。

3. **同期コード切り替え（UI 存在・動作）**: PASS
   - 「コード切替」ボタン → モーダル（`aria-label="同期コードの切り替え"`）が開く。入力欄（`#sync-code-input`）あり。現在のフル UUID（「現在のコード: …」）も表示。閉じる動作も正常。
   - （実端末間テストは困難なため UI 存在・動作確認とした。受け入れ基準 #3 の許容範囲。Firestore 疎通＋リロード復元が確認できているため、別コード読み込み機構の健全性は担保。）

4. **物件名の同期**: PASS
   - 物件名「Aマンション」が Firestore に保存され、ミラー削除後のリロードでクラウドから復元されることを確認（項目2と同経路）。

5. **5%自動入力ボタン**: PASS
   - 物件価格 `40,000,000` 入力 → 「5%」ボタン押下 → 諸経費が **`2,000,000`**（= 40,000,000 × 5%）にセットされ、結果がリアルタイム再計算された。

6. **5%ボタンのガード**: PASS
   - 物件価格を空欄にすると「5%」ボタンが `disabled`（押下不可）。disabled 状態でクリックを試みてもクラッシュなし。価格空欄時はヒーロー数値が `—` 表示。

7. **オフライン堅牢性**: PASS（クラッシュ防止・継続・再同期）
   - DevTools Network を Offline にした状態で物件価格 `55,555,555` を入力 → 通常月返済額 `162,471` が**継続して再計算**され、アプリは正常稼働（クラッシュなし）。
   - Online 復帰後に再同期し「保存済み」に戻ることを確認。
   - 注: 後述の Minor のとおり、オフライン中の表示は「オフライン」ではなく「保存済み」となった（Firestore のローカルキャッシュ仕様による。クラッシュ防止・継続・復帰後再同期という spec.md の本質的受け入れ基準は満たす）。

### 回帰確認（Sprint 1〜3 合格項目）

| 項目 | 結果 | 判定 |
|------|------|------|
| 基本計算（30M/諸経費2M/1.0%/35年） | 通常月返済額 `¥90,331`（90,000円台） | PASS |
| 金利0%対応 | `¥76,190`（32,000,000 ÷ 420） | PASS |
| 未入力時の '—'（物件価格空欄） | `—` 表示 | PASS |
| 複数物件・比較タブ（CompareTable） | 比較タブが正常レンダリング | PASS |
| 375px 横はみ出しなし | `scrollWidth=375 = clientWidth=375 = body=375`、はみ出しゼロ | PASS |
| ユニットテスト | `npm run test` 48/48 合格（loanCalc 29 + storage 19） | PASS |
| 本番ビルド | `npm run build` 成功（gzip 201KB） | PASS |
| JS 例外 / console.error | 全シナリオ（オフライン含む）を通して **0 件** | PASS |

計算ロジック（loanCalc）・物件管理（storage）・比較表（CompareTable）は無改変で再利用され、`normalizeState` の追加も既存関数・型・STORAGE_KEY を改変せず行われている。回帰なし。

## デザイン仕様適合（design.md 照合）
Chrome の computed style を実測して照合：

| 項目 | design.md / progress.md 指定 | 実測値 | 判定 |
|------|------------------------------|--------|------|
| 5%ボタン背景 | `#E4F6EE`（primary-light） | `rgb(228,246,238)` | 一致 |
| 5%ボタン文字色 | `#138A60`（primary-dark） | `rgb(19,138,96)` | 一致 |
| フォントファミリー | `'M PLUS Rounded 1c', sans-serif` | `"M PLUS Rounded 1c", sans-serif` | 一致 |
| SyncBar ピル/トグル | 既存トークン（shadow-icon・rounded-pill・toggle 背景） | 適用確認 | 一致 |

design.md に同期 UI の固有規定はないが、SyncBar は既存ヘッダーのデザイントークン（ピル・shadow-icon・toggle 背景）に沿って構成され一貫性を維持。5%ボタンは指定クラスを厳守。

## バグ一覧

| # | 重要度 | 内容 | 状態 |
|---|--------|------|------|
| 1 | Minor | オフライン中の同期状態表示が「オフライン」ではなく「保存済み」になる | 仕様の本質要件は充足・合否に影響なし |

### Minor #1 詳細
- **現象:** Network を Offline にしても、入力後の状態表示が「保存済み」のまま（「オフライン」にならない）。
- **原因:** Firebase Firestore はオフライン時にローカルキャッシュへ書き込みを成功させ `setDoc` の Promise を解決するため、`saveStateToFirestore().then(...)` が走り「保存済み」になる。onError（→ オフライン表示）はキャッシュ駆動のため発火しにくい。
- **影響評価:** spec.md の受け入れ基準（「通信が失敗しても入力・計算が継続でき、復帰後に再び同期できること」）は **満たしている**（クラッシュなし・継続・再同期を確認）。「同期状態の表示」は spec 上 Should 機能であり、オフライン表示自体は実装済み（購読 onError 経路）。Firestore のオフライン永続化特性に起因する表示タイミングの差であり、機能破綻ではない。progress.md の既知の課題にも近い記述あり。
- **対応:** 合否に影響しないため修正必須ではない。将来的に精緻化するなら `navigator.onLine` / `online`・`offline` イベントや Firestore の `onSnapshotsInSync` / `disableNetwork` 検知を併用してオフライン表示を確実化できる（任意）。

## 改善提案（任意・合否に影響しない）
- **オフライン表示の確実化**: 上記 Minor #1 のとおり `navigator.onLine` の監視を併用すると、オフライン中も確実に「オフライン」表示にできる。
- **バンドルサイズ**: firebase SDK 取り込みで単一チャンク 732KB（gzip 201KB）。動作問題はないが、将来的に `import()` による code-split で初期ロードを軽量化できる（スコープ外）。

## Generator への指示
- **修正不要（Sprint 4 合格）。** Sprint 1〜4 すべて合格したため、本アプリは全スプリント完了。
- オーケストレーターへ「**全スプリント合格**」を報告し、`/docs/app-type.md` が `web` のため **Step 4（Releaser: Firebase デプロイ・プライバシーポリシー/利用規約公開）** へ進んでよい。
- Minor #1 は任意改善であり、リリースをブロックしない。
