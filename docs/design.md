# デザイン仕様

**確定日:** 2026-06-27
**採用案:** 入力フォーム = A案（標準セクション分割フォーム） / 計算結果 = A案（シンプル大型・グリーングラデーションカード） / 物件比較 = B案（表形式）
**生成元:** claude.ai/design（AIDesigner MCP フォールバックフロー）
**参照モック:** `docs/_design_reference.html`

> Generator はこの仕様の色コード・px 値・font 値をそのまま実装に使うこと。デザインに記載のない数値を独自判断で補わないこと。乖離が生じる場合は `/docs/progress.md` に理由を明記する。

---

## ブランド・スタイル

### コンセプト
親しみやすい丸ゴシック（M PLUS Rounded 1c）と「ニュートラル + グリーン1色」の落ち着いた配色。数値も同書体で統一し、金融ツールでありながら堅すぎない、スマホ優先の見やすさを重視する。

### カラーパレット
| 役割 | カラーコード | 用途 |
|------|------------|------|
| Primary（グリーン） | `#1EB980` | CTAボタン背景、アクティブ要素、強調数値、スライダー fill、セクション見出し |
| Primary Dark | `#138A60` | hover/active、グラデーション終端、最安行の強調文字 |
| Primary Light | `#E4F6EE` | 最安行ハイライト背景、固定タブの選択バッジ |
| Text Primary（ダーク） | `#19231E` | 見出し・本文・数値、テーブルヘッダー背景、PCサイドバー背景 |
| Background | `#F5F7F4` | ページ背景、入力フィールド背景、フッターグラデーション |
| Surface（白） | `#FFFFFF` | カード、結果サマリーカード、入力カード背景 |
| Text Secondary | `#6E7B73` | ラベル、補助テキスト、説明文 |
| Text Muted | `#A6B0A8` | プレースホルダー、キャプション、単位記号（¥ など） |
| Border | `#E6EAE5` | カード枠、入力フィールド枠、スライダー track |
| Border Light | `#F0F3EF` | リスト内区切り線、テーブルセル間ボーダー |
| Row Alt（交互背景） | `#FAFBFA` | テーブル偶数行背景 |
| Toggle背景 | `#EEF2EE` | セグメントトグル背景、戻るボタン背景 |
| Dark内の補助テキスト | `#9BB0A6` | ダーク背景上の説明文・サイドバー非選択項目 |

### グラフ・内訳用の補助グリーン階調
| 役割 | カラーコード | 用途 |
|------|------------|------|
| Accent 1 | `#8FD9BC` | 内訳バー2番目、グラフ中間色 |
| Accent 2 | `#CDEBDD` | 内訳バー3番目、利息部分、グラフ淡色 |
| Accent 3 | `#BFE9D6` | グラフ中間トーン |

### タイポグラフィ
- **フォントファミリー:** `'M PLUS Rounded 1c', sans-serif`（Google Fonts）
  - 読み込み: `https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap`
- **ウェイト運用:** 400=通常 / 500=説明文 / 600=ラベル・補助 / 700=値・強調 / 800=見出し・主要数値
- **アンチエイリアス:** `-webkit-font-smoothing: antialiased`
- `* { box-sizing: border-box; }` をグローバルに適用

| 用途 | サイズ / ウェイト | 色 |
|------|-----------------|----|
| 画面タイトル（h1相当） | 800 22px | `#19231E` |
| ヘッダー見出し | 800 17-18px | `#19231E` |
| セクション見出し（フォーム内） | 800 13px | `#1EB980` |
| ラベル | 600 12px | `#6E7B73` |
| 入力値テキスト | 700 15-17px | `#19231E` |
| 結果メイン数値 | 800 64px / letter-spacing -2px | `#fff`（グラデーションカード上） |
| サマリー数値 | 800 15-18px | `#19231E` |
| キャプション・単位 | 600-700 10-12px | `#A6B0A8` |

### スペーシング
- **基本グリッド:** 4px 単位
- **画面横パディング:** 18px（スマホ）/ 22-28px（カード内・PC main）
- **カード内パディング:** 16px（標準）/ 20-32px（結果・大型カード）
- **カード間マージン:** 14px
- **セクション見出し下マージン:** 14px

### ボーダー半径
| 要素 | 半径 |
|------|------|
| 入力フィールド | 13px |
| 標準カード | 16-20px |
| 結果グラデーションカード | 26px |
| 大型カード（内訳） | 24px |
| CTAボタン | 16px |
| バッジ・ピル | 20px（または 100px相当の full） |
| セグメントトグル外枠 | 12px / 内タブ 9px |
| PCコンテナ | 16px |

### シャドウ
| 用途 | box-shadow |
|------|-----------|
| 標準カード | `0 1px 4px rgba(0,0,0,.04)` |
| 浮きカード（最安など） | `0 4px 14px rgba(30,185,128,.16)` |
| CTAボタン | `0 6px 16px rgba(30,185,128,.35)` |
| 結果グラデーションカード | `0 10px 28px rgba(30,185,128,.35)` |
| ホームの主役カード | `0 8px 22px rgba(30,185,128,.3)` |
| FAB（追加ボタン） | `0 8px 20px rgba(30,185,128,.45)` |
| 小アイコンボタン | `0 1px 3px rgba(0,0,0,.06)` |

---

## 画面一覧

### 画面1: 入力フォーム（A案 標準セクション分割）
**目的:** 選択中物件の8項目（物件価格・諸経費・金利・ローン期間・ボーナス元金・管理費・修繕積立費・その他費用）を入力する。
**対象スプリント:** Sprint 1（単一物件）/ Sprint 2 でヘッダーに物件切替を統合

**レイアウト構成:**
- 縦1スクロール構成。背景 `#F5F7F4`。
- 上部ヘッダー: 戻る丸ボタン（34px円・白・`0 1px 3px rgba(0,0,0,.06)`）+ 画面タイトル（800 18px `#19231E`）+ 右側ステータスピル（700 12px `#6E7B73` / 背景白 / padding 6px 11px / radius 20px）。
- メインエリア: 横パディング18px。白カードを3つ縦に積む（物件情報 / 借入条件 / ボーナス・その他費用）。各カード間 margin-bottom 14px。
- 最下部: CTAボタンを固定配置風に置く。上に `linear-gradient(180deg, rgba(245,247,244,0), #F5F7F4 40%)` のフェード、padding 14px 18px 22px。

**カード共通スタイル:**
- `background:#fff; border-radius:20px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.04)`
- セクションヘッダー: `font:800 13px; color:#1EB980; margin-bottom:14px`（絵文字 + ラベル、例: `🏠 物件情報` / `💰 借入条件` / `📋 ボーナス・その他費用`）

**入力フィールド:**
- ラベル: `font:600 12px; color:#6E7B73; margin-bottom:6px`
- フィールド本体: `background:#F5F7F4; border:1.5px solid #E6EAE5; border-radius:13px; padding:12px 13px; font:700 15px; color:#19231E`
- 通貨入力は先頭に `¥`（`color:#A6B0A8; margin-right:6px`）、`display:flex; align-items:center` で並べる。金額は3桁区切り表示。
- 2項目を横並びにする場合は `display:flex; gap:10px;` で各 `flex:1`（例: 借入金額 + 頭金）。フィールド間の margin-bottom 14px。
- **フォーカス時:** border 色を `#1EB980` に変更（1.5px solid）。

**金利タイプ セグメントトグル:**
- 外枠: `background:#EEF2EE; border-radius:12px; padding:4px; display:flex; gap:4px`
- 選択タブ: `flex:1; text-align:center; background:#fff; border-radius:9px; padding:9px; font:700 13px; color:#138A60; box-shadow:0 1px 3px rgba(0,0,0,.07)`
- 非選択タブ: `flex:1; text-align:center; padding:9px; font:600 13px; color:#6E7B73`（背景なし）

**スライダー（金利・返済期間）:**
- 行上部: ラベル（600 12px `#6E7B73`）+ 現在値（右寄せ）。値は金利=`800 15px #1EB980`、期間=`800 15px #19231E`、単位（%・年）は `font:700 11px` で続ける。
- track: `height:6px; background:#E6EAE5; border-radius:3px; margin:10px 0`（relative）
- fill: `position:absolute; left:0; top:0; height:6px; background:#1EB980; border-radius:3px; width:<割合>%`
- thumb: `width:22px; height:22px; background:#fff; border:3px solid #1EB980; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,.15)`、`top:50%; transform:translate(-50%,-50%)`
- スライダー操作でリアルタイムに値と計算結果が更新されること。

**ボーナス・その他費用カード（金額一覧行）:**
- 各行: `display:flex; justify-content:space-between; align-items:center; padding:6px 0`
- ラベル `font:600 13px; color:#6E7B73`、値 `font:700 15px; color:#19231E`。`/月` などの単位は `font:600 11px; color:#A6B0A8`。
- 2行目以降は `border-top:1px solid #F0F3EF`。

**CTAボタン:**
- `background:#1EB980; border-radius:16px; padding:16px; text-align:center; font:800 16px; color:#fff; box-shadow:0 6px 16px rgba(30,185,128,.35)`
- ラベル例: 「月々の支払いを計算する」
- **hover:** background `#138A60`。**active:** わずかに沈む（transform: translateY(1px) など任意）。

**インタラクション:**
- 全入力・スライダー変更で結果がリアルタイム再計算される（ボタン不要。ボタンは結果画面への遷移用途）。
- 空欄・不正値はクラッシュさせず、結果側で '—' 表示。

---

### 画面2: 計算結果（A案 シンプル大型）
**目的:** 選択中物件の月々支払額を大きく強調表示し、主要指標と総返済額を見せる。
**対象スプリント:** Sprint 1

**レイアウト構成:**
- 背景 `#F5F7F4`。横パディング18px。
- ヘッダー: 戻る丸ボタン + タイトル「試算結果」（800 17px `#19231E`）+ 右に三点メニュー丸ボタン（34px円・白・文字 `#6E7B73`）。
- 物件サマリー行 → グラデーション結果カード → 3指標カード → 総返済額カード → 下部CTA、の順で縦積み。

**物件サマリー行（結果上部）:**
- `display:flex; align-items:center; gap:10px; background:#fff; border-radius:16px; padding:10px; box-shadow:0 1px 4px rgba(0,0,0,.04); margin-bottom:16px`
- サムネ: `46px×46px; border-radius:11px`（プレースホルダーは斜めストライプ `repeating-linear-gradient(45deg,#EAEFEA,#EAEFEA 5px,#F3F6F3 5px,#F3F6F3 10px)`）
- 物件名 `font:800 14px; color:#19231E`、サブ `font:600 11px; color:#A6B0A8`（例: 物件価格 ¥42,800,000）

**結果グラデーションカード（主役）:**
- `background:linear-gradient(160deg,#1EB980,#138A60); border-radius:26px; padding:32px 24px; text-align:center; box-shadow:0 10px 28px rgba(30,185,128,.35)`
- ラベル: `font:700 13px; color:rgba(255,255,255,.85)`（例: 「月々のお支払い」）
- メイン数値: `display:flex; align-items:baseline; justify-content:center; gap:2px; color:#fff; margin:8px 0 4px`。`¥` を `font:800 26px`、金額を `font:800 64px; letter-spacing:-2px; line-height:1`。
- ボーナス月バッジ: `display:inline-block; font:700 12px; color:#fff; background:rgba(255,255,255,.2); padding:6px 14px; border-radius:20px`（例: 「ボーナス月は ¥135,100」）
- **未入力・計算不能時:** 金額を `—` で表示し、バッジは非表示またはラベルのみ。

**3指標カード（借入額・金利・期間）:**
- `display:flex; gap:10px; margin-top:18px`、各 `flex:1`
- 各カード: `background:#fff; border-radius:16px; padding:14px 12px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,.04)`
- ラベル `font:600 11px; color:#A6B0A8`、値 `font:800 15px; color:#19231E; margin-top:3px`

**総返済額カード:**
- `display:flex; justify-content:space-between; align-items:center; background:#fff; border-radius:16px; padding:16px; margin-top:14px; box-shadow:0 1px 4px rgba(0,0,0,.04)`
- ラベル `font:700 13px; color:#6E7B73`、値 `font:800 18px; color:#19231E`

**内訳表示（仕様要件: 通常月返済額・ボーナス払い月額換算・管理費・修繕積立費・その他費用）:**
- 上記サマリーに加え、内訳明細を `padding:8px 0` の行（ラベル `600 13px #6E7B73` / 値 `700 14px #19231E`、行間 `border-top:1px solid #F0F3EF`）で白カード内に列挙する。計算不能な構成要素は '—'。

**下部CTA:**
- `display:flex; gap:12px; padding:14px 18px 24px`
- 左: お気に入りボタン `width:54px; background:#fff; border-radius:16px; font:700 20px; color:#1EB980; box-shadow:0 1px 4px rgba(0,0,0,.06)`（♡）
- 右: メインCTA `flex:1; background:#1EB980; border-radius:16px; padding:16px; text-align:center; font:800 16px; color:#fff; box-shadow:0 6px 16px rgba(30,185,128,.35)`（例: 「比較リストに追加」）

**インタラクション:**
- 入力変更に応じてリアルタイム更新。
- 「比較リストに追加」で比較ビューへ反映。

---

### 画面3: 物件比較（B案 表形式）
**目的:** 複数物件の主要指標を縦方向の表でセル単位に比較する。最安の月々支払を強調。
**対象スプリント:** Sprint 3

**レイアウト構成:**
- 背景 `#F5F7F4`。横パディング18px。
- ヘッダー: タイトル「比較表」（800 18px `#19231E`）。
- 比較テーブルを白カード（`border-radius:20px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04)`）で包む。
- 最下部にCTA「＋ 物件を追加して比較」（メインCTAスタイル）。

**テーブル構造（CSS flex で行を構成）:**
- 各行 = `display:flex`。先頭はラベル列、続いて物件ごとの値列。
- **ラベル列:** `width:92px; flex-shrink:0`。
- **値列:** 各 `flex:1; text-align:center`。列間に左ボーダー。
- 物件が増えると値列が横に追加される。スマホで列が増える場合はテーブルカードを横スクロール可能にする（ラベル列は固定が望ましい）。

**ヘッダー行:**
- `display:flex; background:#19231E`
- ラベルセル: `width:92px; padding:14px 12px; font:700 11px; color:#9BB0A6`（例: 「物件」）
- 物件名セル: `flex:1; padding:14px 8px; text-align:center; border-left:1px solid rgba(255,255,255,.08)`、テキスト `font:800 12px; color:#fff; line-height:1.2`（長い名前は改行可）

**月々行（最重要・ハイライト）:**
- 行背景 `#E4F6EE`
- ラベル: `font:700 11px; color:#138A60`（「月々」）
- 最安セル: 値 `font:800 16px; color:#138A60`、その下に `font:700 9px; color:#1EB980` で「最安 ✓」バッジ的表示
- 非最安セル: 値 `font:800 16px; color:#19231E`
- 値セル間ボーダーはこの行のみ `border-left:1px solid #fff`

**データ行（物件価格・頭金・金利・返済期間・ボーナス・管理費等）:**
- ラベルセル: `padding:13px 12px; font:600 11px; color:#A6B0A8`
- 値セル: `padding:13px 8px; text-align:center; font:700 13px; color:#19231E; border-left:1px solid #F0F3EF`
- **交互背景:** 奇数行 `#fff` / 偶数行 `#FAFBFA`（行単位で `background:#FAFBFA` を付与）
- **未入力・計算不能セル:** '—' を表示し、他列のレイアウトを崩さない。

**総返済額行（フッター・強調）:**
- 行上に `border-top:2px solid #F0F3EF`
- ラベル: `font:700 11px; color:#6E7B73`（「総返済額」）
- 最安セル: `font:800 14px; color:#138A60`、他: `font:800 14px; color:#19231E`、`border-left:1px solid #F0F3EF`

**インタラクション:**
- 物件追加・削除が即座にテーブル列へ反映。
- 最安判定（月々支払合計の最小値）を自動でハイライト。全物件が '—' の場合はハイライトなし。

---

## レスポンシブ対応方針

スマホファースト。ブレークポイントの目安: モバイル < 768px / タブレット 768–1024px / デスクトップ ≥ 1024px（基準幅 1280px）。

### モバイル（< 768px、基準 375px）
- 上記3画面のスタイルがそのまま基準。横スクロール・はみ出しゼロを必須とする（仕様 Sprint 3 受け入れ基準）。
- 比較表は列が増えたらテーブルカードを横スクロールにし、ラベル列（92px）を固定する。
- 画面下にボトムナビ（ホーム / 比較 / 設定）を置く場合: `background:#fff; border-top:1px solid #F0F3EF; padding:14px 0 26px; display:flex; justify-content:space-around`。選択項目 `font:700 11px; color:#1EB980`（上に 6px の `#1EB980` ドット）、非選択 `font:600 11px; color:#A6B0A8`。
- 新規追加 FAB（任意）: `width:58px; height:58px; border-radius:50%; background:#1EB980; color:#fff; font:300 32px; box-shadow:0 8px 20px rgba(30,185,128,.45)`、右下 `right:22px; bottom:88px`。

### タブレット（768–1024px）
- 入力フォームと結果を2カラム（左=入力 / 右=結果）に並べてよい。各カラムは最大幅を設け中央寄せ。
- 比較表はセル padding を維持したまま値列を広げる。

### デスクトップ（≥ 1024px、基準 1280px）
- **左サイドバーナビ構成**に切り替える。サイドバー: `width:200px; background:#19231E; padding:22px 16px`。
  - ロゴ: `28px角; border-radius:8px; background:#1EB980; color:#fff; font:800 14px` + アプリ名 `font:800 15px; color:#fff`
  - ナビ項目: `padding:11px 12px; border-radius:11px; font:600 13px`。非選択 `color:#9BB0A6`、選択 `background:#1EB980; color:#fff; font-weight:700`
- メインエリア: `padding:26px 28px`。上部に見出し（800 22px `#19231E`）+ サブ（500 13px `#6E7B73`）+ 右上「＋ 物件を追加」ボタン（`font:700 13px; color:#fff; background:#1EB980; padding:10px 18px; border-radius:12px`）。
- 比較は**横並びカード + 棒グラフ**で表示可能（表形式の代替/補強）:
  - カード: `flex:1; border:2px solid #EEF2EE; border-radius:16px; overflow:hidden`。最安カードは `border:2px solid #1EB980; box-shadow:0 6px 18px rgba(30,185,128,.14)` + 左上「最安」ピル（`font:800 10px; color:#fff; background:#1EB980; padding:4px 10px; border-radius:20px`）。
  - カード内月々: `font:800 28px; letter-spacing:-1px`。最安は `#1EB980`、他は `#19231E`。
  - 明細行: `font:600 12px; color:#6E7B73; line-height:2.1`、値を `<b style="color:#19231E">`。
  - 比較棒グラフ（任意）: `width:150px; background:#F5F7F4; border-radius:16px; padding:16px`。バーは最安 `#1EB980`、他 `#CDEBDD` / `#8FD9BC`、`border-radius:5px 5px 0 0`。
- ただし B案（表形式）が確定採用のため、デスクトップでも表形式を基本とし、横並びカードは画面幅に余裕がある場合の補助表現とする。

---

## コンポーネントパターン（横断仕様）

### ボタン
- **Primary（CTA）:** `background:#1EB980; color:#fff; border-radius:16px; padding:16px; font:800 16px; box-shadow:0 6px 16px rgba(30,185,128,.35)`。hover `#138A60`。
- **Secondary（戻る/サブ）:** `background:#EEF2EE`（または `#fff`）`; color:#6E7B73; border-radius:16px`。
- **アイコン丸ボタン:** `34-36px円; background:#fff; color:#19231E/#6E7B73; box-shadow:0 1px 3px rgba(0,0,0,.06)`。
- **FAB:** 上記モバイル節参照。

### バッジ / ピル
- 標準: `padding:5-7px 11-14px; border-radius:20px; font:700 11-12px`
- グリーン系: `background:#1EB980; color:#fff`（強調）/ `background:#E4F6EE; color:#138A60`（淡）/ `background:rgba(255,255,255,.2); color:#fff`（グラデ上）
- ニュートラル: `background:#F0F3EF; color:#6E7B73`

### 入力フォーム（再掲）
- 枠: `1.5px solid #E6EAE5`、フォーカス時 `#1EB980`。背景 `#F5F7F4`、radius 13px、padding 12px 13px。
- ラベル: `600 12px #6E7B73`。エラー時はボーダーを Error 表現にしテキストを赤系で補足（本アプリは '—' 表示が基本のため、明示的エラー文言は最小限）。

### カード
- 標準: `background:#fff; border-radius:16-20px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.04)`。

### プレースホルダー画像
- 斜めストライプ: `repeating-linear-gradient(45deg,#EAEFEA,#EAEFEA Npx,#F3F6F3 Npx,#F3F6F3 2Npx)`（N=5–7、サイズに応じて）。

---

## 実装ガイダンス（Generator 向け）

### 推奨 CSS 戦略
- **CSS Modules または Tailwind CSS** を推奨。理由: 上記の固定数値（radius/padding/shadow/font）をデザイントークン化しやすく、3画面で再利用するカード・ボタン・スライダー・テーブルセルを共通化できるため。
- カラー・スペーシング・radius・shadow を CSS 変数（または Tailwind theme）として一元定義し、本書のトークンと1対1で対応させること。

### 推奨ライブラリ
- **UIコンポーネント:** 素の HTML + CSS で十分実装可能（特殊な依存は不要）。必要なら shadcn/ui を補助的に利用可。
- **アイコン:** lucide-react（戻る `‹`、メニュー `⋯`、ハート、＋ など）。絵文字（🏠💰📋）はセクション見出しにそのまま使用してよい。
- **スライダー:** ネイティブ `<input type="range">` をデザイン仕様の見た目（track 6px `#E6EAE5` / fill `#1EB980` / thumb 22px 白+3px緑枠）に合わせてスタイリングする。
- **数値整形:** 3桁区切りは `Intl.NumberFormat('ja-JP')` 等を使用。

### 避けるべきパターン
- インラインスタイルの多用（モックは静的 HTML のためインラインだが、実装ではトークン化したクラスへ移すこと）。
- 固定 px 幅でのレイアウト固定によるレスポンシブ破綻（ラベル列 92px 等の意図的固定を除き、コンテンツ幅は flex/grid で可変に）。
- 計算結果を独自フォーマットで '—' 以外のエラー文字にすること（仕様上、計算不能は必ず '—'）。

### 状態表現
- **未入力 / 計算不能（NaN/Infinity）:** 値は必ず '—'。結果カードのメイン数値・内訳・比較セルすべてに適用。
- **最安ハイライト:** 比較表の月々行・総返済額行で最小値を `#138A60` + `#E4F6EE` 背景で強調。
- **hover/active:** Primary ボタンは `#138A60`、カードは任意で軽い elevation 変化。
- **selected（トグル/ナビ):** トグルは白タブ + shadow、ナビは `#1EB980` 背景 + 白文字。
