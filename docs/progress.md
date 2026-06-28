# 実装進捗

## Sprint 7: 夫婦優先度比較
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-28

### 実装内容
- **型定義の追加（`src/lib/storage.ts`）**: `PriorityMap`（`Record<string, number>`）/ `CustomItem`（`{ key; label }`）/ `CoupleConditions`（`{ husband; wife; customItems }`）を追加。`PersistState` に `coupleConditions: CoupleConditions` を追加（必須フィールド）。`properties` / `activeId` には一切干渉しない別系統データ。
- **正規化・後方互換（`storage.ts`）**: `emptyCoupleConditions()`（`{ husband:{}, wife:{}, customItems:[] }`）/ `normalizeCoupleConditions(raw)` を追加。優先度マップは 1〜5 の整数のみ採用（小数は四捨五入、範囲外・非数値・0 は除外）、カスタム項目は key/label が文字列の要素のみ採用。不正・欠損時は空データを返す。`createInitialState()`・`loadState()`・`normalizeState()` の全 `PersistState` 返却経路に `coupleConditions` を補完。`coupleConditions` を持たない旧データ（Sprint 6 以前）はデフォルト空で初期化される。
- **固定条件項目（`src/lib/coupleConditions.ts` 新規）**: 指定の11項目を安定キー（`station`/`price`/`size`/`newBuilding`/`maintenance`/`sunlight`/`storage`/`parking`/`school`/`shopping`/`quiet`）で `FIXED_CONDITIONS` に定義。
- **夫婦優先度ページ（`src/components/CouplePriorityPage.tsx` 新規）**:
  - 内部サブタブ `husband | wife | compare`（セグメントトグル `bg-toggle`/選択 `bg-surface text-primary shadow-icon`）。
  - 夫・妻タブ: 固定11項目＋カスタム項目を縦並び表示。各行に ★1〜5 のクリック可能ボタン（選択値以下を `★`/`text-primary`、超過を `☆`/`text-border`）。同じ星を再タップで 0（未入力）に戻す。未入力は全 `☆`。
  - カスタム項目追加フォーム（各タブ下部）: テキスト入力 + 「追加」ボタン（Enter キーでも追加）。追加項目は固定11項目の下に表示し、各カスタム項目に削除ボタン（`X`）。削除時は husband/wife 両マップから該当キーの値も除去。
  - 比較タブ: 全条件（固定＋カスタム）をテーブル表示（条件 / 👨夫 / 👩妻 / 差）。★は `★★★☆☆` の5文字列で表示、未入力は「未入力」表記。`|husband - wife| >= 2` の行は `bg-amber-50 border-l-2 border-amber-400` で強調し ⚠（`AlertTriangle`）、完全一致（両者入力済みで差0）は ✓（`Check`）、両者未入力は `—`、それ以外（差1）は差数値を表示。
- **App.tsx にトップレベルページ切替を追加**: `PageMode = 'loan' | 'couple'`。ヘッダー下・既存の入力/比較タブの上に「🏠 ローン計算 / 👫 夫婦優先度」トグルを配置。`couple` 時は `CouplePriorityPage` を表示（PCサイドバーの物件一覧は引き続き表示）。`handleCoupleChange`（オフライン時ブロック）を追加。`handleAdd`/`handleDelete` を `...prev` スプレッドに修正し `coupleConditions` を保持。初期 state にも空の `coupleConditions` を追加。
- **Firestore 保存（`firestoreStorage.ts`）**: `saveStateToFirestore` の `setDoc` body に `coupleConditions: state.coupleConditions` を追加。`subscribeToState` は `normalizeState` 経由で復元するため、夫婦優先度も `shared/main` に共有・リアルタイム同期される（スキーマ分岐なし）。
- **ユニットテスト（`storage.test.ts`）**: 夫婦優先度11ケースを追加（empty/初期化/正常採用/範囲外除外/四捨五入/不正カスタム除外/旧データ補完/normalizeState保持/save・load永続化/不正入力正規化）。既存テストの `PersistState` リテラル・期待値に `coupleConditions` を追記。**計63ケース全合格**（loanCalc 29 + storage 34）。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | Sprint 7 受け入れ基準を全て満たす。ページ切替・夫/妻/比較サブタブ・★1〜5入力・独立保持・カスタム追加削除・横並び比較・差分強調・shared/main共有・後方互換すべて実装。 |
| コード品質 | 5 | 夫婦優先度を独立コンポーネント・独立 lib に分離。計算ロジック（loanCalc）は無改変。正規化を `normalizeCoupleConditions` に集約し後方互換を構造化。 |
| UI/UX | 4 | デザイントークン（toggle/surface/primary/border/amber）を踏襲。★Unicode で直感的な入力、比較表は差分を色・アイコンで一目化。 |
| エラーハンドリング | 5 | 範囲外/非数値/小数/不正カスタム/欠損 coupleConditions すべてクラッシュせず正規化。未入力は「未入力」表記。オフライン時は disabled + handleCoupleChange ガードで二重防御。 |
| 既存機能との統合 | 5 | ローン計算・物件管理・比較表・メタデータ・オフラインに無改変。handleAdd/Delete のスプレッド修正で coupleConditions も保持。63テスト全合格・回帰なし。 |
| デザイン仕様適合 | 4 | design.md に夫婦優先度の規定はないため、既存トークン（セグメントトグル・カード・テーブルヘッダー `bg-ink`）を流用して構成。差分強調のみ指示通り amber 系を採用。 |

### spec.md 受け入れ基準への対応

| 受け入れ基準 | 対応 |
|---|---|
| トップナビに「夫婦優先度」表示・既存タブと行き来 | PageMode トグル。loan/couple 切替で双方の state を保持（別 useState・別 setState 経路） |
| 夫/妻/比較の3サブタブ切替 | CouplePriorityPage 内 `subTab` セグメントトグル |
| 夫タブで固定11項目を1〜5入力・即反映 | StarRow ボタン→ setPriority → onChange → setState |
| 妻タブで独立入力・夫と混ざらない | husband/wife を別 PriorityMap で保持 |
| カスタム項目追加が全タブに反映 | `customItems` を3ビュー共通の items 配列に統合 |
| カスタム項目削除・他値保持 | removeCustom が該当キーのみ削除、固定項目・他カスタムは不変 |
| 比較タブで夫妻を横並び表示 | テーブル（条件/夫/妻/差） |
| 差 ≥2 の項目を強調表示 | `bg-amber-50 border-l-2 border-amber-400` + ⚠ |
| coupleConditions を shared/main に保存・リロード/別端末で共有 | saveStateToFirestore に追記、normalizeState で復元 |
| 旧データ（coupleConditions なし）を読んでもクラッシュしない | normalizeCoupleConditions がデフォルト空で補完（テスト確認） |
| 夫婦優先度操作でローン計算等が変化しない | coupleConditions は別系統、toLoanInput/calculateLoan は未接続 |
| Sprint 1〜6 全機能に回帰なし | 計算/物件管理/比較/メタ/オフライン無改変、63テスト合格 |

### 技術的な判断
- **`coupleConditions` を `PersistState` の必須フィールドに**: 後方互換は `normalizeCoupleConditions` の補完で担保し、型上は必須として全構築箇所での欠落をコンパイル時に検出（App.tsx 初期 state・handleAdd/Delete の修正もこれで誘発）。
- **未入力＝値なし（マップにキーを持たない）**: 優先度 0 はマップから `delete` し、保存サイズを抑え「未入力」と「1」を明確に区別。比較表で `?? 0` を「未入力」として表現。
- **カスタムキーは `custom-${createId()}`**: 既存 `createId`（UUID）を流用し、ラベル変更・重複ラベルでもキー衝突しない安定キーを生成。
- **差分の3段階表示**: 差≥2＝⚠（強調）/ 差0かつ両入力＝✓ / 両未入力＝— / 差1＝数値、で「分かれている」「一致」「未着手」を視覚的に区別。
- **PCサイドバー（物件一覧）は couple ページでも表示維持**: タスクの実装者判断に委ねられた点。ローン計算側の物件選択状態を保ったままページ往復できるよう常時表示とした。

### デザイン仕様との乖離
- **夫婦優先度 UI のスタイル**: design.md（3画面）に夫婦優先度の規定がないため、既存デザイントークン（セグメントトグル `bg-toggle`/`bg-surface`、カード `rounded-card shadow-card`、比較テーブルヘッダー `bg-ink text-[#9BB0A6]`）を流用して一貫性を維持。差分強調はタスク指示通り `bg-amber-50`/`border-amber-400`/`text-amber-500` を採用。

### 既知の課題
- 比較タブはカスタム項目が多い場合に縦に伸びる（横スクロールは差列のみ。物件比較表と異なり列固定は不要なため許容）。
- 夫婦優先度はオフライン中は閲覧のみ可・編集ブロック（Sprint 5 の読み取り専用モードと整合）。サブタブ切替自体はオフラインでも可能（ローカル UI 状態）。

### Evaluator への引き渡し事項
- **起動方法**: `npm install`（初回のみ）→ `npm run dev`（Vite 開発サーバ。既定 http://localhost:5173）
- **ビルド確認**: `npm run build`（tsc 型チェック + vite build、エラーなし）
- **テスト**: `npm run test`（vitest、63ケース全合格）
- **テスト対象URL**: http://localhost:5173
- **テストシナリオ**:
  1. ヘッダー下の「👫 夫婦優先度」トグルをクリック → 夫婦優先度ページに遷移。「🏠 ローン計算」で戻れる。往復してもローン計算側の物件・入力値が保持される。
  2. 夫婦優先度ページで「夫」「妻」「比較」サブタブを切替できる。
  3. 「夫」タブで各条件の★をクリックし 1〜5 を設定（同じ★再クリックで未入力に戻る）。「妻」タブで別の値を設定し、夫の値と混ざらないことを確認。
  4. 「条件を追加」に任意ラベルを入力→「追加」。夫・妻・比較の全タブに新項目が表示され、それぞれ★入力できる。カスタム項目の ✕ で削除すると固定項目・他の値は保持される。
  5. 「比較」タブで夫と妻の★が横並び表示される。差が★2以上の行がアンバー背景＋⚠で強調、一致行は✓で表示される。
  6. リロードしても入力した優先度・カスタム項目が保持される（shared/main 共有）。別ブラウザで開いても同じ優先度が表示され、一方の編集が他方にリアルタイム反映される。
  7. ローン計算側（物件価格変更・物件追加など）を操作しても夫婦優先度が変化しない（逆も同様）。
  8. オフライン（DevTools で Offline）にすると読み取り専用バナーが出て、夫婦優先度の★・追加・削除が無効化される。閲覧・比較表示は継続。

---

## Sprint 6: 物件メタデータ（URL・メモ・物件種別・アクセス）
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-28

### 実装内容
- **`Property` 型へメタ4フィールドを追加（`src/lib/storage.ts`）**: `url: string` / `memo: string` / `buildingAge: 'new' | 'used' | null` / `walkMinutes: string`。すべて任意入力（空文字・未選択を許容）。ローン計算には一切干渉しない（`FormValues` とは別の物件直下フィールド）。
- **`createProperty()` の初期値**: `url: ''`, `memo: ''`, `buildingAge: null`, `walkMinutes: ''` を追加。
- **後方互換の正規化 `normalizeProperty()`**: `loadState()` と `normalizeState()` の物件マップ処理を共通化。Sprint 5 以前のメタフィールドを持たない物件データを読み込んでもデフォルト値で補完される。`buildingAge` は `'new'/'used'` 以外を `null` に丸め、`walkMinutes` は旧データが number 型でも数値文字列へ変換（後方互換）。
- **メタデータ更新ハンドラ `handleMeta`（`src/App.tsx`）**: `FormValues` 専用の `handleChange` とは別経路で `Property` を直接更新。オフライン中（読み取り専用）と物件未選択時はガードして編集をブロック。`LoanForm` に `property={active}` `onMeta={handleMeta}` `disabled={offline}` を渡す。
- **「物件情報」セクションを `LoanForm.tsx` に追加**: ローン計算用カード群の**上部**に配置。`SectionHeading`（`font-extrabold text-[13px] text-primary mb-[10px]`）で「物件情報」「ローン計算」の2グループに視覚的に区分。
  - 物件URL: 地球儀アイコン（`Globe`）付きテキスト入力。URL 入力済み時はラベル横に外部リンクアイコン（`ExternalLink`）を表示し、別タブ（`target="_blank" rel="noopener noreferrer"`）で開ける。
  - 新築/中古: 2択トグルボタン。選択中 `bg-primary text-white` / 未選択 `bg-toggle text-muted`。選択中タブの再クリックで未選択（`null`）へ戻せる。
  - 駅徒歩: `inputMode="numeric"` の整数入力（数字以外を除去）、単位「分」。
  - メモ: `<textarea rows={3}>` 複数行（改行保持）。指定クラス `bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[12px] focus:border-primary font-rounded text-[15px] text-ink` 準拠。
  - 全メタフィールドは `disabled` prop（オフライン時）で無効化。
- **比較表 `CompareTable.tsx` にメタ行を追加**: 月々ハイライト行（thead）とローン計算データ行（tbody）の**間（上部）**に「物件種別」「駅徒歩」「物件URL（30文字短縮＋別タブリンク）」の3行を追加。各物件のメタ情報を横並び比較できる。URL セルはフル URL を `title` と `href` に保持しつつ表示を短縮。交互背景はメタ3行分のオフセット（`META_ROW_COUNT`）でデータ行まで連続。
- **Firestore 同期**: `saveStateToFirestore` は `state.properties`（メタフィールド込みの Property 配列）をそのまま `shared/main` 直下に保存し、`subscribeToState` は `normalizeState` 経由で復元するため、スキーマ変更なしでメタ情報が共有・リアルタイム同期される。
- **ユニットテスト**: `storage.test.ts` にメタデータ5ケースを追加（createProperty デフォルト・save/load 永続化・normalizeState 保持・旧データのデフォルト補完・不正値正規化）。**計53ケース全合格**（loanCalc 29 + storage 24）。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | Sprint 6 受け入れ基準を全て満たす。URL 入力/リンク・複数行メモ・新築中古トグル（未選択許容）・駅徒歩入力・比較表3行・共有同期・後方互換すべて実装。 |
| コード品質 | 5 | 正規化を `normalizeProperty` で `loadState`/`normalizeState` 共通化。メタ更新を `handleMeta` で `handleChange` から分離。計算ロジックは無改変。 |
| UI/UX | 4 | デザイントークン（color/radius/font/shadow）を踏襲し「物件情報」「ローン計算」を視覚区分。トグル選択色・URLアイコン・単位ラベルを整備。 |
| エラーハンドリング | 5 | 空欄・未選択・不正 buildingAge・number 型 walkMinutes・空URL いずれもクラッシュせず '—' 表示／デフォルト補完。オフライン時は disabled + handleMeta ガードで二重防御。 |
| 既存機能との統合 | 5 | 計算ロジック・複数物件管理・比較表・オフライン読み取り専用・5%ボタンは無改変で動作。既存48 + 新規5 = 53テスト全合格。回帰なし。 |
| デザイン仕様適合 | 4 | 指定ヘッダー/トグル/textarea クラスを厳守。design.md にメタUIの規定はないため既存トークンで構成（下記乖離参照）。 |

### spec.md 受け入れ基準への対応

| 受け入れ基準 | 対応 |
|---|---|
| 物件URL を入力→保存・表示、リンクで別タブを開く | テキスト入力 + ラベル横/比較表の `<a target="_blank" rel="noopener noreferrer">` |
| 複数行メモを保存・表示、改行保持 | `<textarea rows={3}>`、`memo: string` をそのまま保存（テストで `\n` 保持を確認） |
| 新築/中古トグル切替・未選択も保持 | トグルボタン、再クリックで `null` 復帰、`buildingAge` を保存 |
| 駅徒歩を整数入力・空欄でも破綻しない | numeric 入力（数字以外除去）、空文字は '—' 表示 |
| 比較表に種別/徒歩/URL 行追加・URL もリンク | CompareTable に3行追加、URL セルは短縮表示 + 別タブリンク |
| `shared/main` に保存・リロード/別端末で共有 | Property 配列に追記保存、normalizeState で復元。スキーマ変更なし |
| メタ変更で計算結果が変化しない（非干渉） | メタは `Property` 直下、`toLoanInput`/`toInput` は `values` のみ参照。計算経路に未接続 |
| 旧データ（メタなし）を読んでもクラッシュしない | `normalizeProperty` がデフォルト補完（テストで確認） |
| Sprint 1〜5 全機能に回帰なし | 計算/物件管理/比較/オフライン/5%ボタン無改変、53テスト合格 |

### 技術的な判断
- **`walkMinutes` を number ではなく string 型で実装**: spec.md 実装ガイドは `walkMinutes?: number` を例示するが、本タスク指示（より具体的な実装ガイド）と既存の数値入力パターン（`CurrencyInput`/`SliderField` がすべて文字列で生入力を保持し、空文字＝未入力を表現）に合わせ `string` を採用。空欄表現が `undefined` より一貫し、表示・保存・正規化が単純化する。旧データの number 型は `normalizeWalkMinutes` で数値文字列へ変換し後方互換を確保。
- **メタ更新を別ハンドラ `handleMeta` に分離**: `handleChange` は `FormValues`（計算入力）専用のため、計算への非干渉を構造的に保証する目的でメタ更新経路を完全分離した。
- **既存「物件情報」カードのタイトルを「物件価格・諸経費」へ改称**: 新設のメタ「物件情報」セクションとカード見出しの名称衝突を避けるため、price/miscCost を含む既存カードを「物件価格・諸経費」へ改称し「ローン計算」グループ配下に配置（下記デザイン乖離参照）。
- **新築/中古トグルの再クリックで未選択へ**: 「未選択状態の許容」を満たすため、選択中タブの再タップで `null` に戻せる仕様とした（一度選ぶと解除不能になる事故を防止）。
- **比較表の交互背景オフセット**: メタ3行を追加したことでデータ行のゼブラ縞が連続するよう `(idx + META_ROW_COUNT) % 2` でオフセットし、視覚的連続性を維持。

### デザイン仕様との乖離
- **既存カード見出し「🏠 物件情報」→「🏠 物件価格・諸経費」へ改称**: design.md（画面1）は最初のカード見出しを「🏠 物件情報」と規定するが、Sprint 6 でメタデータ専用の「物件情報」セクションを新設するため名称が衝突する。価格・諸経費は金額（ローン計算）入力であり、メタ情報（URL/メモ/種別/アクセス）こそが本来の「物件情報」であるため、既存カードを「物件価格・諸経費」へ改称し、メタセクションに「物件情報」を割り当てた。emoji・カードスタイル・トークンは維持。
- **メタUI（トグル/URL/textarea）のスタイル**: design.md にメタフィールドの規定がないため、本タスク指示のクラス指定と既存デザイントークン（`bg-bg`/`border-border`/`rounded-field`/`bg-toggle`/`bg-primary` 等）で構成した。

### 既知の課題
- 比較表の物件数が多い場合、URL 行は30文字短縮＋横スクロールで対応するが、極端に長い URL 列は引き続き横スクロール前提（既存比較表の方針を踏襲）。
- メモは textarea の `resize-y` を許可。比較表にはメモ行を追加していない（spec.md の比較表要件は種別/徒歩/URL の3行のみ）。

### Evaluator への引き渡し事項
- **起動方法:**
  ```bash
  cd /Users/toshiki-kojima/my-project/myhome-loanplan
  npm run dev
  # → http://localhost:5173/
  ```
- **ビルド/テスト:** `npm run build`（型チェック + ビルド成功）/ `npm run test`（53ケース全合格）
- **テスト対象URL:** http://localhost:5173/
- **テストシナリオ:**
  1. 入力タブで最上部「物件情報」セクションを確認。物件URLに `https://example.com` を入力 → ラベル横の外部リンクアイコンが出現 → クリックで別タブに該当URLが開くこと。
  2. 「新築」をクリック → 緑背景に反転。もう一度クリック → 未選択（グレー）に戻る。「中古」を選択して保存されること。
  3. 駅徒歩に `7` を入力（数字以外は弾かれる）。メモに複数行（改行を含む）を入力し、改行が保持されること。
  4. これらメタ入力で右側の月々支払額・各種計算結果が**変化しないこと**（非干渉）。
  5. 物件を2件以上にして「比較」タブへ。月々行の下に「物件種別」「駅徒歩」「物件URL」行が並び、URL がクリックで別タブに開くこと。
  6. ブラウザをリロード → 入力したメタ情報が保持されること（`shared/main` 共有同期）。別ブラウザで開いても同じメタ情報が表示されること。
  7. オフライン（DevTools で offline）にすると上部バナーが出て、物件情報フィールド（URL/トグル/徒歩/メモ）が編集できないこと。オンライン復帰で再び編集可能になること。

---

## Sprint 4: クラウド同期（Firestore）+ 同期コード共有 + 入力補助
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-27

### 実装内容
- **Firebase 初期化 `src/lib/firebase.ts`**: 提供された SDK config で `initializeApp` / `getFirestore` を初期化。認証なし（同期コード方式）。
- **Firestore ストレージ層 `src/lib/firestoreStorage.ts`** 新規作成:
  - `getSyncId()`: localStorage キー `myhome-loanplan-sync-id` から同期コードを取得。未保存なら `crypto.randomUUID()` で自動発行して保存（初回アクセス時の自動発行）。
  - `saveSyncId(id)`: 別端末コードへの切り替え時に同期コードを保存。
  - `subscribeToState(syncId, onState, onError)`: `onSnapshot` で `sessions/{syncId}` をリアルタイム購読。ドキュメントの `state` フィールドを `normalizeState` で検証し、`PersistState | null` をコールバックに渡す。購読開始失敗・通信エラーでもクラッシュしない（onError 通知のみ）。
  - `saveStateToFirestore(syncId, state)`: `setDoc` で `{ state, updatedAt }` を保存（state は `{ properties, activeId }` の素オブジェクト）。
  - localStorage 非対応環境（プライベートモード等）でも try/catch でガードし、都度生成にフォールバック。
- **`src/lib/storage.ts` に `normalizeState(parsed)` を追加**: 任意のパース済みオブジェクト（Firestore の `state` フィールド）を `PersistState` に検証・正規化する純粋関数。不正物件の除外・欠損 values 補完・activeId 整合・空配列尊重を localStorage 読み込みと共通化。**STORAGE_KEY・既存型・既存関数は無改変**（テスト依存を維持）。
- **App.tsx のクラウド同期統合**:
  - 起動時に `getSyncId()` で同期コードを取得（state 初期値は従来どおり `loadState()` で localStorage から復元 → Firestore 接続までの初期表示 & offline fallback）。
  - `syncId` ごとに `subscribeToState` でリアルタイム購読。初回スナップショットで「クラウドにデータあり → 採用」／「未作成 → 現在のローカル状態を migration（押し上げ）して新規セッション作成」を判定。2回目以降のスナップショット（別端末の変更）は即反映。
  - データ変更時は Firestore へ保存 + localStorage ミラー（offline fallback）。`applyingRemoteRef`（リモート由来更新の再保存抑止）と `readyRef`（初回スナップショット前の上書き防止）で同期ループ・初期上書きを防止。
  - 別端末コード切り替え（`handleSwitchSync`）で `setSyncId` → 購読 effect 再実行 → 新コードのデータを読み込み。
- **同期 UI `src/components/SyncBar.tsx`** 新規作成:
  - 同期コード先頭8文字 + コピーボタン（`navigator.clipboard` + execCommand フォールバック、コピー後チェックアイコン）。
  - クラウド同期状態（接続中／保存中／保存済み／オフライン）をアイコン付きで表示。
  - 「コード切替」ボタン → モーダルダイアログでフル UUID を入力し別端末データを読み込み。現在のフルコードも表示。
- **諸経費 5% 自動入力ボタン `LoanForm.tsx` / `CurrencyInput.tsx`**:
  - `CurrencyInput` に `action` スロットを追加し、入力欄右側に補助ボタンを配置可能に。
  - 諸経費欄横に「5%」ボタンを設置。押下で物件価格 × 5%（四捨五入）を諸経費にセット → リアルタイム再計算。
  - 物件価格未入力時は `disabled`（クラッシュ防止）。デザイン指定 `bg-primary-light text-primary-dark font-bold text-[11px] px-[8px] py-[6px] rounded-[8px]` に準拠。
- **ユニットテスト**: `storage.test.ts` に `normalizeState` の6ケースを追加（正常正規化・不正データ null・空配列・activeId 整合・欠損補完・不正物件除外）。**計48ケース全合格**（loanCalc 29 + storage 19）。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | Sprint 4 受け入れ基準を全て満たす（下記対応表）。同期コード自動発行・表示・コピー・切替・Firestore 保存/復元・物件名同期・5%ボタンすべて動作。Firestore 実書き込みを node スクリプトで write/read/delete 確認済み。 |
| コード品質 | 5 | Firestore 層を純粋なストレージ API として分離。検証ロジックを `normalizeState` で localStorage と共通化。同期ループ防止を ref で明示管理。 |
| UI/UX | 4 | design.md のカラー/radius/shadow/font をトークンで踏襲。同期コードはピル表示、切替はモーダル。状態表示でユーザーに同期状況を可視化。 |
| エラーハンドリング | 5 | 通信失敗・購読失敗・localStorage 非対応・clipboard 失敗・物件価格未入力の 5% 押下、すべて握りつぶしてクラッシュしない。offline 表示 + localStorage fallback で入力・計算継続。 |
| 既存機能との統合 | 5 | 計算ロジック・物件管理・比較表示は無改変で再利用。Sprint 1〜3 の 42 テスト全合格 + 新規6ケース = 48 全合格。回帰なし。 |
| デザイン仕様適合 | 4 | 5%ボタンは指定クラスを厳守。SyncBar は既存ヘッダーのトーン（ピル・shadow-icon・toggle）に合わせた。design.md に同期 UI の規定はないため既存トークンで構成。 |

### spec.md 受け入れ基準への対応

| 受け入れ基準 | 対応 |
|---|---|
| 初回アクセスで同期コード自動生成・画面表示 | `getSyncId()` が UUID 自動発行、SyncBar に先頭8文字表示 |
| 物件追加・編集が Firestore に保存・再読込で復元 | `saveStateToFirestore` + `subscribeToState`。実書き込みを確認 |
| コードをコピー → 別端末で入力 → 同じ一覧/値/名/選択物件 | コピーボタン + コード切替ダイアログ → 購読再実行で remote 採用 |
| 物件名変更がクラウド保存・別端末反映 | name は state に含まれ Firestore へ保存・onSnapshot で反映 |
| 5%ボタンで物件価格×5%セット → 即再計算 | `fillMiscCost5pct` が onChange 経由で更新、useMemo で即時再計算 |
| 物件価格未入力で 5% 押下してもクラッシュしない | `disabled={priceEmpty}` + 内部ガード（Number 検証） |
| 通信失敗でも入力・計算継続、復帰後に再同期 | onError で offline 表示・localStorage fallback、復帰で onSnapshot 再配信 |
| Sprint 1〜3 全機能の回帰なし | 計算・物件管理・比較・レスポンシブ無改変、48 テスト合格 |

### 技術的な判断
- **Firestore 保存形式は素オブジェクト**: `setDoc(ref, { state, updatedAt })`。spec の「`state` フィールドに `{ properties, activeId }`」に忠実。JSON 文字列化ではなくネイティブ map/array で保存し、コンソールからの可読性を確保。
- **localStorage の「migration 後削除」は実施せず、継続ミラーに変更（design/spec からの意図的判断）**: タスク指示の「ローカルを削除」と「localStorage を offline fallback として維持」が相反するため、受け入れ基準「通信失敗でも入力・計算継続」を優先し、localStorage を常時ミラー（毎変更で書き込み）として保持した。初回 Firestore 未作成時はローカル state を押し上げる migration を実施するが、ローカルキーは削除せず offline 復帰用に残す。これにより一貫した堅牢性を確保。
- **同期ループ防止**: `applyingRemoteRef`（リモート由来の setState は Firestore へ再保存しない）と `readyRef`（初回スナップショット受信前は保存せず、リモートデータの上書きを防ぐ）の 2 フラグで制御。effect 定義順（購読 effect → 保存 effect）により、syncId 切替時も保存 effect が `readyRef=false` を見て早期 return する。
- **新規/存在しないコードへの切替時**: remote が null の場合は現在のローカル state を新コードへ押し上げる（非破壊。実在しないコードへの誤入力でもデータを失わない）。実在コードなら remote を採用。
- **5% の端数処理**: `Math.round(price * 0.05)` で整数円に丸め。CurrencyInput は数字のみ保持するため整数文字列で格納。
- **同期 UI の配置**: design.md に同期 UI 規定がないため、ヘッダー下に SyncBar 行を追加。ピル・shadow-icon・toggle 背景など既存デザイントークンで構成し一貫性を維持。

### 既知の課題
- 同期コードのアクセス制御・暗号化は対象外（spec 制約事項どおり）。コードを知る者は誰でもアクセス可能。
- ビルドの単一チャンクが 732KB（gzip 201KB）。firebase SDK 取り込みによる増加。動作上の問題はないが、将来的に code-split 余地あり（本スプリントのスコープ外）。
- onSnapshot のローカル書き込み即時反映により、保存中ステータスは短時間（高速回線では「保存済み」が支配的）。

### Evaluator への引き渡し事項
- **起動方法**:
  ```bash
  cd /Users/toshiki-kojima/my-project/myhome-loanplan
  npm install   # 初回のみ
  npm run dev
  ```
- **テスト対象URL**: `http://localhost:5173/`
- **ユニットテスト**: `npm run test`（48ケース: loanCalc 29 + storage 19）
- **ビルド確認**: `npm run build`（成功）
- **localStorage キー**: 物件データ `myhome-loanplan-properties`（offline fallback ミラー）／同期コード `myhome-loanplan-sync-id`（DevTools > Application > Local Storage で確認可）
- **Firestore 確認**: Firebase Console > Firestore > `sessions` コレクション。ドキュメントID = 同期コード（フル UUID）。`state.properties` / `state.activeId` を確認可能。書き込みは node スクリプトで疎通確認済み。
- **UIの操作要点**:
  - ヘッダー下の **同期コードピル**（「同期コード xxxxxxxx」+ コピーアイコン `aria-label="同期コードをコピー"`）。
  - その右に **同期状態**（接続中／保存中／保存済み／オフライン）。
  - 「**コード切替**」ボタン → モーダル（`aria-label="同期コードの切り替え"`）でフル UUID を入力 → 「読み込む」。
  - 諸経費欄の右に **「5%」ボタン**（`aria-label="物件価格の5%を諸経費に入力"`）。物件価格未入力時は disabled。
- **テストシナリオ**:
  1. **同期コード自動発行・表示**: 初回アクセス（localStorage クリア状態）→ ヘッダー下に「同期コード」+ 8文字が表示されること。DevTools で `myhome-loanplan-sync-id` に UUID が保存されていること。
  2. **Firestore 保存・復元**: 物件価格 `30000000` 等を入力 → 状態が「保存済み」になること。Firebase Console の `sessions/{コード}` に `state` が書き込まれること。ページをリロード → 同じデータが復元されること。
  3. **同期コードによる共有（端末間）**: ブラウザA でコピーアイコンを押し同期コードをコピー → 別ブラウザ/シークレットウィンドウB を開き「コード切替」にそのコードを貼り付け「読み込む」→ B に A と同じ物件一覧・入力値・物件名・選択物件が表示されること。続けて A で物件価格を変更 → B の表示がリアルタイム（または再表示）で更新されること。
  4. **物件名の同期**: A で物件名を「Aマンション」に変更 → 同じコードの B で「Aマンション」が表示されること。
  5. **5% 自動入力**: 物件価格 `40000000` を入力 → 諸経費横の「5%」ボタンを押下 → 諸経費が `2,000,000`（= 40,000,000 × 5%）になり、月々支払合計などが即再計算されること。
  6. **5% ガード**: 物件価格を空欄にする → 「5%」ボタンが disabled（押下不可）でクラッシュしないこと。
  7. **オフライン堅牢性**: DevTools Network を Offline にする → 入力・計算が継続でき、状態が「オフライン」表示になり、アプリがクラッシュしないこと。Online に戻すと再同期できること。
  8. **回帰確認（Sprint 1〜3）**: 物件価格 `30000000`/諸経費 `2000000`/金利 `1`/期間 `35` → 通常月返済額 90,000円台。金利 `0` → `¥76,190`。価格空欄や金利 `abc` で該当結果が '—'。複数物件の追加・切替・削除・比較タブ・375px はみ出しなし・PC サイドバーが Sprint 3 同様に動作すること。

### 起動方法（再掲・必須）
```bash
cd /Users/toshiki-kojima/my-project/myhome-loanplan
npm run dev
# → http://localhost:5173/
```

---

## Sprint 3: 物件比較表示 + UI仕上げ
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-27

### 先行修正（Sprint 1 フィードバック Major #1）
- `src/components/CurrencyInput.tsx` のルート `div` に `min-w-0` を追加。375px スマホ幅での管理費/修繕積立費 2カラム行のはみ出しを修正。

### 実装内容
- `src/components/CompareTable.tsx` 新規作成: 全物件の主要指標を表形式で横並び比較。
  - ヘッダー行（背景 #19231E・物件名 white）+ 月々支払合計ハイライト行（背景 #E4F6EE・最安 ✓ バッジ）+ 10行のデータ行
  - 表示項目: 物件価格・諸経費・総借入額・金利・返済期間・ボーナス払い月換算・管理費・修繕積立費・その他費用・総返済額
  - ラベル列 92px 固定、交互背景（#fff / #FAFBFA）、`overflow-x: auto` でスマホ横スクロール対応
  - 未入力・計算不能は '—' 表示（`formatYen` / `fmtRate` / `fmtYears` 経由）
  - 物件0件時は「物件を追加すると比較できます」メッセージ
- `src/App.tsx` 更新: 「入力」/「比較」切り替えタブを追加。`viewMode` state で制御。
  - タブ: SlidersHorizontal（入力）・LayoutList（比較）アイコン付き toggle ボタン
  - 比較タブで `<CompareTable properties={properties} />` を表示

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | 全10行比較表・最安バッジ・入力/比較タブ切替・スクロール対応すべて実装 |
| 動作安定性 | 5 | ビルド成功・42テスト合格・console エラーなし |
| UI/UX品質 | 4 | design.md の表形式B案に準拠。タブは toggle スタイルで一貫性あり |
| エラーハンドリング | 5 | 空欄・NaN・0件物件すべて '—' または専用メッセージで安全処理 |
| 回帰なし | 5 | Sprint 1〜2 の計算ロジック・物件管理・永続化に変更なし |
| デザイン仕様適合 | 4 | カラー・フォント・行スタイルを design.md から正確に適用 |

### spec.md 受け入れ基準

| 受け入れ基準 | 対応状況 |
|---|---|
| 3件登録 → 月々支払合計が横並び比較 | ✓ CompareTable の月々ハイライト行に3列で表示 |
| 空欄のある物件セルが '—' | ✓ `formatYen(null)` → '—' |
| 375px でのはみ出しなし | ✓ `min-w-0` 追加 + 比較表は `overflow-x: auto` |
| PC 1280px で読みやすいレイアウト | ✓ PCサイドバーあり、比較表は全幅で可読 |
| 金利0%と金利あり物件の同時比較 | ✓ `calcMonthlyPayment` が両パターンで正常値を返す |
| 比較表示と編集画面の行き来 | ✓ タブ切替のみでデータ変化なし |

### Evaluator への引き渡し事項
- **起動方法**: `cd /Users/toshiki-kojima/my-project/myhome-loanplan && npm run dev`
- **テスト対象URL**: `http://localhost:5173/`
- **ユニットテスト**: `npm run test`（42ケース全合格）
- **ビルド確認**: `npm run build`（成功）
- **テストシナリオ**:
  1. **3物件比較**: 物件3件を追加し各々異なる物件価格・金利を入力 → 「比較」タブで月々支払合計が横並び表示。最安値に「最安 ✓」バッジ表示。
  2. **空欄の '—' 表示**: 物件の1つを物件価格空欄のまま「比較」タブ → 月々と関連セルが '—' 表示、他物件の値は正常。
  3. **375px 確認**: ブラウザ幅 375px で入力フォームの管理費/修繕積立費 2カラム行がはみ出さないこと。比較表は横スクロールで全列閲覧可能。
  4. **PC 1280px 確認**: 左サイドバー + 入力フォーム + 比較表が読みやすくレイアウトされること。
  5. **タブ切替の整合**: 入力タブで値を変更 → 比較タブに切り替えると変更が反映されていること。
  6. **回帰確認**: 物件価格3000万/諸経費200万/金利1/期間35 → 通常月返済額 90,000円台。金利0% → ¥76,190。空欄・'abc' → '—'。リロードでデータ保持。

---

## Sprint 1: 基盤構築 + 計算ロジック + 単一物件シミュレーション
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-27

### 実装内容
- プロジェクトセットアップ: React 18 + TypeScript + Vite 5 + TailwindCSS v3。`npm run dev` で起動、`npm run build` でビルド成功、`npm run test`（Vitest）で29テスト合格。
- 計算ロジックモジュール `src/lib/loanCalc.ts`: 純粋関数群（`calcFundComposition` / `calcLoanPrincipal` / `calcMonthlyPayment` / `calcBonusPayment` / `calcBonusMonthly` / `calcMonthlyTotal` / `calcTotalRepayment` / `calculateLoan`）と表示用フォーマッタ（`formatNumber` / `formatYen`）、入力パーサ（`parseNumberInput`）。
- ローン入力フォーム（8項目）: 物件価格・諸経費・ボーナス元金・管理費・修繕積立費・その他費用（金額入力／3桁区切り表示）、金利・返済期間（テキスト入力＋スライダー同期）。
- 金利0%対応: ゼロ除算を避け `元金 / 返済回数` で算出。
- null安全表示: 未入力（undefined）・NaN・Infinity は計算関数が `null` を返し、UI は '—' を表示。
- リアルタイム再計算: `useMemo` により入力変更と同時に結果が更新（ボタン操作不要）。
- 計算結果表示: 月々支払合計を大型グリーングラデーションカードに強調表示し、内訳（通常月返済額・ボーナス払い月額換算・管理費・修繕積立費・その他費用・月々支払合計）、3指標（総借入額・金利・期間）、総返済額、資金構成サマリーを表示。
- ユニットテスト `src/lib/loanCalc.test.ts`: 29ケース（理論値検証・金利0%・null安全・パーサ）。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | Sprint 1 受け入れ基準を全て満たす。3,000万/諸経費200万/金利1.0%/35年で通常月返済額 ≈ ¥90,304（90,000円台）、金利0%で元金÷回数=¥76,190、価格空欄で合計 '—'、金利に文字/負数でクラッシュせず '—'、3桁区切り、合計=通常+管理+修繕+その他 を確認。 |
| コード品質 | 5 | 計算ロジックを純粋関数として完全分離。型ガード `isValid` で一元化。コンポーネントを CurrencyInput / SliderField / LoanForm / ResultCard に分割。 |
| UI/UX | 4 | design.md のカラー・フォント・radius・shadow・グラデーションをトークン化して忠実に実装。スマホ縦積み／PC 2カラムレスポンシブ対応。 |
| エラーハンドリング | 5 | 空欄・文字・負数・0除算・全角数字を全て安全に処理。結果は必ず '—'。 |
| 既存機能との統合 | 5 | 初回スプリントのため回帰なし。 |

### 技術的な判断
- **金利・返済期間はスライダー＋テキスト入力の併用**: design.md はスライダー指定だが、受け入れ基準「金利欄に文字や負数など計算不能な値が入っても '—' 表示」を満たすには自由テキスト入力が必須。両立のため `type="text"` のテキスト入力とレンジスライダーを同期させた（`SliderField`）。design からの意図的な拡張であり乖離ではない。
- **固定費（管理費・修繕積立費・その他費用・ボーナス元金）の初期値を "0"**: spec の strict な null安全（構成要素が undefined なら合計 null）を維持しつつ、価格未入力時のみ '—' となる自然な UX を実現するため。物件価格・諸経費は空欄初期値で、未入力時に合計が '—' になることを確認。
- **金利は 0〜5%（step 0.05）、期間は 1〜50年（step 1）のスライダー範囲**: design に範囲指定がないため一般的な住宅ローンの範囲を設定。テキスト入力は範囲外・非数値も受理。
- **総返済額・資金構成サマリーを Sprint 1 で先行実装**: design 画面2に含まれるため。spec では Should（#14）だが計算関数が揃っているため表示まで実装。
- **ボーナス月バッジ**: design の「ボーナス月は ¥XXX」は「月々支払合計＋ボーナス1回分」を表示。ボーナス元金>0 のときのみ表示。
- **CSS 戦略は TailwindCSS**: design.md 推奨に従い、カラー/radius/shadow/font を `tailwind.config.js` のテーマトークンとして design.md と1対1対応で定義。
- **TypeScript ビルド構成**: Vite 標準のプロジェクト参照（tsconfig.node.json）が composite/noEmit 競合を起こしたため、単一 tsconfig + `tsc --noEmit && vite build` に簡素化。型チェックは有効。

### 既知の課題
- Sprint 2（複数物件管理・永続化）・Sprint 3（比較表示・UI仕上げ）は未着手。現状は単一物件のみ。
- ヘッダーの戻るボタン・ステータスピルは Sprint 1 では装飾（遷移先が無いため非機能）。Sprint 2 で物件切替に統合予定。
- design 画面2の「お気に入り」「比較リストに追加」CTA は複数物件機能（Sprint 2/3）に依存するため未実装。

### Evaluator への引き渡し事項
- **起動方法**:
  ```bash
  cd /Users/toshiki-kojima/my-project/myhome-loanplan
  npm install   # 初回のみ
  npm run dev
  ```
- **テスト対象URL**: `http://localhost:5173/`
- **ユニットテスト**: `npm run test`（29ケース）
- **ビルド確認**: `npm run build`
- **テストシナリオ**:
  1. **理論値検証**: 物件価格に `30000000`、諸経費に `2000000`、金利スライダー/入力を `1`、返済期間を `35`、ボーナス元金 `0`、管理費 `0`、修繕積立費 `0`、その他費用 `0` を入力 → 内訳「通常月返済額」が **¥90,300前後（90,000円台）** で表示されること。
  2. **金利0%対応**: 金利欄を `0` にする → '—' やエラーにならず、通常月返済額が **¥76,190**（32,000,000 ÷ 420）になること。
  3. **null安全（価格空欄）**: 物件価格を空欄にする → 月々支払合計（ヒーロー数値）が **'—'** になること。
  4. **null安全（不正値）**: 金利欄に `abc` や `-1` を入力 → アプリがクラッシュせず、月々支払合計と内訳の通常月返済額が **'—'** になること。
  5. **リアルタイム再計算**: いずれかの入力を変更すると、ボタンを押さずに結果が即座に更新されること。スライダーをドラッグしても即時更新されること。
  6. **3桁区切り**: 金額が `¥1,234,567` のようにカンマ区切りで表示されること。
  7. **合計整合性**: 管理費 `12000`、修繕積立費 `8000` を入力 → 月々支払合計 = 通常月返済額 + 12,000 + 8,000 となること（内訳と一致）。
  8. **レスポンシブ**: 375px幅で横スクロール・はみ出しが無いこと。1280px幅で入力フォームと結果が2カラムで表示されること。

### 起動方法（再掲・必須）
```bash
cd /Users/toshiki-kojima/my-project/myhome-loanplan
npm run dev
# → http://localhost:5173/
```

---

## Sprint 2: 複数物件管理
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-27

### Sprint 1 フィードバックの先行対応
- **Minor #2（ヘッダーの戻るボタンが非機能）: 解消。** ヘッダー左の旧「戻る丸ボタン（‹）」を**物件一覧トグルボタン**（`ListTree` アイコン）に置き換え、Sprint 2 の物件切り替えナビと統合した。モバイルではこのボタンで物件一覧パネルを開閉でき、押下すると実際に機能する（`aria-expanded` 連動）。
- **Major #1（375px 横はみ出し）は Sprint 2 では未対応。** Evaluator 指示どおり Sprint 3 のレスポンシブ受け入れ基準で `min-w-0` 付与により対応する（本スプリントのスコープ外）。

### 実装内容
- **データモデル / 永続化レイヤ `src/lib/storage.ts`**: `Property`（id・name・values）と `PersistState`（properties・activeId）を定義。`createId` / `createProperty` / `nextPropertyName` / `createInitialState` / `loadState` / `saveState` を実装。localStorage キーは **`myhome-loanplan-properties`**。破損JSON・欠損キー・localStorage 非対応環境でもクラッシュせずデフォルト初期化・補完する堅牢設計。
- **物件の追加**: ヘッダー「＋」ボタン（モバイル）/ サイドバー「物件を追加」ボタン（PC）/ 空状態の追加ボタンから新規物件を作成。デフォルト名は `物件N`（既存最大番号+1で衝突回避）。追加と同時にその物件が選択状態になる。
- **物件の切り替え**: モバイルは一覧トグルで開くドロップダウンパネル、PC は左ダークサイドバーの物件リストから選択。選択物件の入力値・計算結果に即座に切り替わる。
- **物件名の編集**: ヘッダーの物件名がインライン編集可能な入力欄（`aria-label="物件名"`）。入力すると一覧（サイドバー/パネル）の表示名にもリアルタイム反映。
- **物件の削除**: 各物件の × ボタンで削除。選択中物件を削除した場合は残りの先頭物件へ自動切り替え。他物件のデータは保持。
- **データ永続化**: `useEffect` で状態変更のたびに localStorage へ保存。リロード後も全物件・入力値・物件名・選択物件が復元される。
- **空状態（全物件削除）対応**: 物件0件でもクラッシュせず、`EmptyState`（追加ボタン付き）を表示。再追加で通常画面へ復帰。
- **レイアウト**: PC（lg以上）はデザイン仕様の**ダーク #19231E・幅200pxの左サイドバー**（ロゴ + 物件一覧 + 追加ボタン）を常時表示。モバイルはヘッダーのトグルで開閉するドロップダウンパネル。
- **ユニットテスト `src/lib/storage.test.ts`**: 13ケース（ID一意性・物件生成・命名規則・保存復元の独立性・破損/欠損/空配列フォールバック・activeId 整合）を追加。既存 `loanCalc.test.ts` 29ケースと合わせて **計42ケース全合格**。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | Sprint 2 受け入れ基準6項目を全て満たす（下記対応表参照）。追加・切替・改名・削除・永続化・空状態すべて動作。 |
| コード品質 | 5 | 永続化を純粋関数群として `storage.ts` に分離。状態は単一の `PersistState` で一元管理し immutable 更新。型安全・破損データ耐性あり。 |
| UI/UX | 4 | design.md の PC ダークサイドバー（#19231E・200px・選択時 primary 背景）・カラー・radius を踏襲。モバイルは一覧トグル + 編集可能な見出しで直感的に切り替え可能。 |
| エラーハンドリング | 5 | 破損JSON・欠損キー・存在しない activeId・全削除・localStorage 非対応をすべて安全に処理。Sprint 1 の入力 null安全も維持。 |
| 既存機能との統合 | 5 | 計算ロジック（loanCalc）・入力フォーム・結果カードは無改変で再利用。Sprint 1 の29テスト全合格＝回帰なし。 |

### 受け入れ基準への対応

| spec.md 受け入れ基準 | 対応 |
|----------------------|------|
| 物件2件追加・異なる価格 → 切替で混ざらず正しく表示 | 各物件が独立 `values` を保持。`storage.test.ts`「混ざらず独立保持」で自動検証 |
| 物件名を「Aマンション」に変更 → 一覧と見出しに反映 | ヘッダー入力欄を編集すると `handleRename` で即時反映、サイドバー/パネルにも反映 |
| 物件削除 → 一覧から消え残データ保持 | `handleDelete` が対象のみ除去、他物件 `values` は不変 |
| 物件1件・複数件いずれも正常動作 | 1件時もサイドバー/パネル/フォーム正常。複数件で切替動作 |
| リロード後も物件・入力値・物件名保持 | `saveState`/`loadState` で localStorage 永続化 |
| 全物件削除後もクラッシュせず新規追加可能 | `EmptyState` 表示 + 追加ボタンで復帰。`loadState` も空配列を尊重 |

### 技術的な判断
- **新規物件のデフォルト値**: spec は「空の入力フォーム」だが、Sprint 1 の初期値（物件価格・諸経費=空欄、金利=1・期間=35・各費用=0）を踏襲。主要入力（物件価格）は空欄のため「空のフォーム」の趣旨を満たしつつ、金利・期間の再入力負担を避けた。Sprint 1 と挙動が一貫。
- **デフォルト命名は「最大番号+1」**: 単純な `length+1` だと中間削除後に重複し得るため、既存 `物件N` の最大番号+1 で一意性を担保。
- **戻るボタンの再定義（Minor #2 統合）**: 単一ページの試算ツールに「戻る」遷移は存在しないため、デザインの丸ボタン位置を活かしつつ機能を**物件一覧トグル**に置換。Evaluator の「物件切替ナビと統合」指示に沿った対応。design からの意図的な役割変更であり、丸ボタンの見た目（34px円・白・shadow-icon）は維持。
- **PC=常時サイドバー / モバイル=トグルパネル**: design.md のレスポンシブ方針（PC は左ダークサイドバー、モバイルは省スペース）に準拠。モバイルで物件一覧を常時表示すると縦スペースを圧迫するため、トグル開閉式とした。
- **永続化のタイミング**: `useEffect([state])` で状態変更ごとに保存。デバウンスは未導入（入力は文字列の差分更新で軽量、体感即時を維持）。
- **空配列の永続化を尊重**: ユーザーが意図的に全削除した場合、リロードで勝手に物件を復活させるとデータ消失の誤解を招くため、明示的な空配列は空のまま復元する（初回・破損時のみデフォルト1物件で初期化）。

### 既知の課題
- 物件**比較表示（横並び）**は Sprint 3 で実装予定（本スプリントは単一物件の編集 + 物件管理まで）。design 画面3（比較表）・PC の比較カードは未実装。
- design 画面2の「お気に入り」「比較リストに追加」CTA は比較機能（Sprint 3）依存のため未実装のまま。
- Major #1（375px 横はみ出し / 管理費・修繕積立費の2カラム行）は Sprint 3 で `min-w-0` 付与により対応予定。

### Evaluator への引き渡し事項
- **起動方法**:
  ```bash
  cd /Users/toshiki-kojima/my-project/myhome-loanplan
  npm install   # 初回のみ
  npm run dev
  ```
- **テスト対象URL**: `http://localhost:5173/`
- **ユニットテスト**: `npm run test`（42ケース: loanCalc 29 + storage 13）
- **ビルド確認**: `npm run build`（成功）
- **localStorage キー**: `myhome-loanplan-properties`（DevTools > Application > Local Storage で確認可）
- **UIの操作要点**:
  - **モバイル幅（<1024px）**: ヘッダー左の一覧アイコンボタン（`aria-label="物件一覧を開く"`）で物件パネルを開閉 → パネル内で物件選択・削除（×）・追加。ヘッダー中央の入力欄（`aria-label="物件名"`）で物件名を編集。右の「＋」ボタン（`aria-label="物件を追加"`）で追加。
  - **PC幅（≥1024px）**: 左のダークサイドバーに物件一覧。クリックで切替、各項目の × で削除、下部「物件を追加」で追加。物件名はヘッダー入力欄で編集。
- **テストシナリオ**:
  1. **複数物件の独立性**: 物件を2件追加。物件1の物件価格に `30000000`、物件2に `45000000` を入力 → 一覧で物件1⇄物件2を切り替えると、それぞれの物件価格・結果が混ざらず正しく表示されること。
  2. **物件名の編集反映**: 選択中物件のヘッダー名入力欄を「Aマンション」に変更 → 物件一覧（PCサイドバー/モバイルパネル）の表示名と見出しが即「Aマンション」になること。
  3. **削除とデータ保持**: 物件を1件削除 → 一覧から消え、残った物件の入力値・計算結果が保持されていること。選択中物件を削除した場合は残りの物件へ自動で切り替わること。
  4. **永続化（リロード）**: 物件2件・各入力値・物件名を設定後にページをリロード → 物件数・各入力値・物件名・選択物件がすべて復元されること（localStorage `myhome-loanplan-properties`）。
  5. **空状態と復帰**: 全物件を削除 → アプリがクラッシュせず空状態（「物件がまだありません」+ 追加ボタン）が表示されること。追加ボタンで新規物件が作成され通常画面に戻ること。
  6. **1件時の動作**: 物件が1件のみの状態でも、フォーム入力・計算・物件名編集・一覧表示が正常に動作すること。
  7. **回帰確認（Sprint 1）**: 物件価格 `30000000`/諸経費 `2000000`/金利 `1`/期間 `35` → 通常月返済額が90,000円台。金利 `0` で `¥76,190`。価格空欄や金利 `abc` で該当結果が '—'。3桁区切り表示。これらが Sprint 1 同様に動作すること。

### 起動方法（再掲・必須）
```bash
cd /Users/toshiki-kojima/my-project/myhome-loanplan
npm run dev
# → http://localhost:5173/
```

---

## Sprint 5: 単一共有ドキュメント方式への移行（localStorage・同期コード廃止）
**ステータス:** 実装完了 - 評価待ち
**実装日:** 2026-06-27

### 実装内容
- **単一共有ドキュメント `shared/main` へ統一**: `src/lib/firestoreStorage.ts` を全面的に書き直し。識別子・パラメータによるドキュメント分岐を撤廃し、固定パス `doc(db, 'shared', 'main')` を読み書きする「共有ホワイトボード」型に変更。
- **`subscribeToState(onState, onError)`**: 引数から syncId を削除。`shared/main` を `onSnapshot` でリアルタイム購読。ドキュメント直下の `{ properties, activeId }` を `normalizeState` で検証・反映する。
- **`saveStateToFirestore(state)`**: 引数から syncId を削除。`setDoc` で `{ properties, activeId, updatedAt }` をドキュメント直下に保存（フィールドのネストを廃し Sprint 4 の `state` ラッパーを除去）。
- **起動時の自動読み込み**: ブラウザを開くと操作なしで `shared/main` を購読・反映。初回（ドキュメント未作成）は `createInitialState()`（物件1件）を書き込んで初期化する。
- **リアルタイム購読の維持**: 他利用者の編集が `onSnapshot` 経由で自動反映される（2回目以降のスナップショットを state へ適用。リモート由来更新は再保存しないループ防止 ref を維持）。
- **オフライン読み取り専用モード**: `navigator.onLine` と `online`/`offline` イベントでオンライン状態を監視。オフライン時は画面最上部に固定バナー「⚠ オフライン中 — 読み取り専用」（背景 `#6E7B73`(muted)・文字白・`sticky/fixed top-0 z-30`）を表示。
- **編集操作のブロック**: `handleChange` / `handleRename` / `handleAdd` / `handleSelect` / `handleDelete` の全てに `if (offline) return;` の早期 return を追加。あわせて UI も無効化（物件名 input は `readOnly`、追加ボタンは `disabled`、フォーム・物件ナビは `opacity-60 pointer-events-none`）。諸経費5%ボタンは LoanForm の `onChange` 経由のため `handleChange` のブロックで無効化される。
- **オンライン復帰時の編集再開**: `online` イベントでバナーが消え、`disabled`/`pointer-events` が解除され、`shared/main` への保存が再開される。
- **入力/比較タブ・物件一覧パネルの開閉**: ローカル UI 状態（共有しない）としてオフライン中も操作可能なまま維持。
- **Firestore セキュリティルール更新**: `firestore.rules` に `match /shared/{docId}` を追加し `firebase deploy --only firestore:rules` で本番反映済み（Sprint 4 の `sessions` ルールは互換のため残置）。

### 削除したもの
- `src/components/SyncBar.tsx` — ファイルごと削除。
- `firestoreStorage.ts` の `getSyncId` / `saveSyncId` / `generateSyncId` / `getStore` / `SYNC_ID_KEY` を削除。
- `App.tsx` の同期コード関連ロジック: `syncId` state・`handleSwitchSync`・SyncBar の import / JSX を削除。
- `App.tsx` からのブラウザローカル保存経由の永続化: `loadState()` 初期値・`saveState(state)` の useEffect を削除（初期 state は空 `{ properties: [], activeId: null }` に変更）。
- `src/lib/storage.ts` は**そのまま残置**（`loadState` / `saveState` / `STORAGE_KEY` 等。`storage.test.ts` が依存）。App.tsx からの呼び出しのみ削除。

### 自己評価

| 基準 | スコア (1-5) | コメント |
|------|-------------|---------|
| 機能完全性 | 5 | ローカル永続化廃止・SyncBar 削除・shared/main 統一・自動読込・onSnapshot 購読・オフライン読取専用・復帰再開を全て実装。受け入れ基準を満たす。 |
| コード品質 | 5 | firestoreStorage を最小 API（subscribe/save）に簡素化。ループ防止 ref は維持。型エラーなし（`tsc --noEmit` 通過）。 |
| UI/UX | 4 | オフラインバナーを最上部に固定、編集 UI をグレーアウト/disabled。同期状態ピル（接続中/保存中/保存済み/オフライン）をヘッダーに表示。SyncBar 削除後のヘッダーを整理。 |
| エラーハンドリング | 5 | 購読開始を try/catch でガード。onError でオフライン表示。オフライン中も onSnapshot キャッシュで閲覧・計算継続。クラッシュなし。 |
| 既存機能との統合 | 5 | 計算ロジック・複数物件管理・比較表示・諸経費5%ボタンは無改変。既存 48 テスト全通過。`npm run build` 成功。 |

### 技術的な判断
- **初回ドキュメント初期化はクライアント側で実施**: `shared/main` 非存在時、最初に開いた利用者が `createInitialState()`（物件1件）を書き込む。空配列で初期化すると初訪問者が空画面になるため、Sprint 1〜4 と同じ「物件1件用意済み」初期体験を維持。
- **保存フォーマットの変更（state ラッパー除去）**: Sprint 4 は `{ state: {...} }` のネストだったが、Sprint 5 仕様の「ドキュメントは properties / activeId フィールドを持つ」に合わせ直下フィールドに変更。`normalizeState(snap.data())` で読み戻す。Sprint 4 の `sessions` 旧データとは非互換だが、同期コード方式自体が廃止されたため影響なし。
- **オフライン判定は `navigator.onLine` を一次ソースに採用**: 仕様の明示要件に従いブラウザのオンライン状態でバナー表示・編集ブロックを制御。加えて Firestore の onError でも `syncStatus='offline'` を反映し堅牢性を補強。
- **編集ブロックは「ハンドラ早期 return」を一次防御、UI 無効化を二次**: 機能的なブロックはハンドラ側で確実に行い、`disabled`/`pointer-events-none`/`readOnly` は視覚フィードバック。両者併用で確実性と視認性を両立。
- **タブ切替・一覧パネル開閉はオフラインでも許可**: これらは `shared/main` を変更しないローカル UI 状態のため、読み取り専用モードでも操作可能とした（閲覧体験を阻害しない）。
- **同期状態ピルを残置**: SyncBar は削除したが、保存中/保存済み/オフラインの状態表示は UX 上有用なためヘッダーに軽量ピルとして残した（`sm:` 以上で表示）。

### デザイン仕様との整合
- オフラインバナーの背景はタスク指定の `#6E7B73`（design.md の Text Secondary / muted トークン `bg-muted`）を使用。文字白・最上部固定。design.md にオフラインバナーの規定はないため、タスク指示を優先（理由をここに明記）。
- ヘッダー・カード・トグル・スライダー等の既存デザイントークンは無改変で維持。

### 既知の課題
- 共有ドキュメント方式のため、複数利用者が同時編集すると後勝ち（last-write-wins）になる。仕様（共有ホワイトボード型・アクセス制御対象外）に沿った想定挙動。
- オフライン中に他端末が更新した場合、復帰後は最新スナップショットで上書きされる（ローカル編集はブロック済みのため衝突は発生しない）。

### Evaluator への引き渡し事項
- **起動方法**:
  ```bash
  cd /Users/toshiki-kojima/my-project/myhome-loanplan
  npm install   # 初回のみ
  npm run dev
  ```
- **テスト対象URL**: `http://localhost:5173/`
- **ビルド確認**: `npm run build`（成功）
- **ユニットテスト**: `npm run test`（48ケース全通過: loanCalc 29 + storage 19）
- **Firestore**: `shared/main` ドキュメント（コレクション `shared` / ドキュメントID `main`）。ルールは本番反映済み。
- **テストシナリオ**:
  1. **自動読み込み（識別子不要）**: ブラウザでアプリを開く → コード入力・ログインを求められず、`shared/main` の物件が自動表示されること。SyncBar（同期コード表示・コピー・切替）が画面に一切無いこと。
  2. **共有データの一致**: ブラウザA で物件を追加・物件価格を入力 → ブラウザB（別ブラウザ/シークレット）で新規に開くと同じ物件データが表示されること。
  3. **リアルタイム反映（onSnapshot）**: ブラウザB を開いたまま、ブラウザA で物件名や入力値を変更 → ブラウザB の表示にも自動反映されること。
  4. **永続化（再読み込み）**: 物件の追加・削除・物件名変更・選択切替を行い再読み込み → 変更が保持されていること（`shared/main` 由来）。
  5. **オフライン読み取り専用**: DevTools の Network を Offline にする（または機内モード）→ 画面上部に「⚠ オフライン中 — 読み取り専用」バナーが表示されること。物件の追加・編集・削除・物件名変更・選択切替・諸経費5%ボタンが全て無効化され、データが変わらないこと。直前データの閲覧・計算結果表示は継続しクラッシュしないこと。
  6. **オンライン復帰**: Network を Online に戻す → バナーが消え、編集操作が再び可能になり保存が再開されること。
  7. **localStorage 非依存の確認**: DevTools > Application > Local Storage を全消去 → 再読み込みしてもデータが失われず `shared/main` から表示されること。App コードに `localStorage.getItem`/`setItem` 呼び出しが無いこと（`grep` で検出されないこと。`src/lib/storage.ts` は未使用の残置モジュールでテスト用）。
  8. **回帰確認（Sprint 1〜4）**: 物件価格 `30000000`/諸経費 `2000000`/金利 `1`/期間 `35` → 通常月返済額が90,000円台。金利 `0` で正常表示。複数物件の独立性・比較タブ・諸経費5%ボタン（オンライン時）が引き続き動作すること。

### 起動方法（Sprint 5・必須）
```bash
cd /Users/toshiki-kojima/my-project/myhome-loanplan
npm run dev
# → http://localhost:5173/
```
