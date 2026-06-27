# harness

Claude Code のサブエージェント機能を使った自動開発パイプライン。短いプロダクトアイデアを入力するだけで、企画 → デザイン → 実装 → 検証 → リリースのサイクルが自動で回り続ける。

## 概要

```
あなた（1〜4行のアイデア＋アプリ種別の選択）
    ↓
Planner  ── /docs/spec.md を生成
    ↓
UIDesigner（提案モード） ── 2〜3パターンのデザイン案を生成・プレビュー
    ↓                      ※ AIDesigner MCP が使えない場合は claude.ai Design で代替
あなた（デザイン案を選択・承認）
    ↓
UIDesigner（確定モード） ── /docs/design.md にデザイン仕様を記録
    ↓
Generator ── スプリント単位で実装 ── /docs/progress.md に記録
    ↓
Evaluator ── Playwright で実動作テスト ── /docs/feedback/sprint-N.md に結果出力
    ↓ 不合格
Generator に差し戻し（修正後に再テスト）
    ↓ 全スプリント合格
    ├─【Web アプリ】──────────────────────────────────────────────────────────────
    │      Releaser ── Firebase Hosting にデプロイ・PP/ToU 公開
    │
    └─【スマホアプリ】────────────────────────────────────────────────────────────
           ※ IAP がある場合は Step 3.5（有料アプリ契約・RevenueCat 確認）を先に実施
           AppStoreValidator ── 申請パラメータ生成・Apple Review 前チェック
               ↓
           Releaser ── EAS 証明書・メタデータ・スクリーンショット準備
```

## エージェント

| エージェント | 役割 | モデル |
|---|---|---|
| **Planner** | アイデアを製品仕様書（`/docs/spec.md`）に展開する | Opus |
| **UIDesigner** | AIDesigner MCP でデザイン案を生成し、ユーザー承認後に `/docs/design.md` を確定する。MCP 未接続時は claude.ai Design にフォールバック | Opus |
| **Generator** | 仕様書・デザイン仕様を読み、1スプリントずつ実装する | Opus |
| **Evaluator** | Playwright MCP でアプリを実際に動かしてテストする | Opus |
| **AppStoreValidator** | ASC・RevenueCat の申請パラメータを生成し、Apple Review 提出前チェックリストを確認する（スマホアプリのみ） | Opus |
| **Releaser** | アプリ種別に応じてリリース作業を自動化する（Web: Firebase デプロイ / スマホ: EAS・メタデータ・スクリーンショット準備） | Opus |

## 使い方

### 0. アプリ種別を選択する

パイプライン開始時に **Web アプリ** か **スマホアプリ** かをオーケストレーターに伝える。選択結果は `/docs/app-type.md` に記録され、リリースフローが切り替わる。

### 1. 新しいプロジェクトを始める

Claude Code を起動し、Planner エージェントにアイデアを渡す：

```
planner エージェントを使って以下のアイデアを仕様書にしてください：
「シンプルなタスク管理アプリ。チームで共有できて、期限と優先度を設定できる」
```

### 2. デザイン案を生成・承認する

Planner が `/docs/spec.md` を生成したら、UIDesigner に提案を依頼する：

```
ui-designer エージェントでデザイン案を提案してください
```

UIDesigner が 2〜3パターンのデザインをプレビュー表示する。気に入った案を選んで確定する：

```
ui-designer エージェントで案Bを確定してください
（修正がある場合）案Aをベースに、カラーをダーク系に変更して確定してください
```

> **AIDesigner MCP が使えない場合**: オーケストレーターが [claude.ai](https://claude.ai) の Design 機能での生成を案内する。生成したデザインのスクリーンショットや HTML を会話に貼り付けると、UIDesigner が `/docs/design.md` に仕様を書き起こす。

### 3. 実装・検証を繰り返す

デザインが確定したら Generator でスプリントを実装する：

```
generator エージェントでスプリント 1 を実装してください
```

Generator の実装が終わったら Evaluator でテストする：

```
evaluator エージェントでスプリント 1 を評価してください
```

合格後は Generator → Evaluator を繰り返す。全スプリント合格でリリースフローへ進む。

### 4. リリースする

#### Web アプリの場合

```
releaser エージェントを実行してください
```

Releaser が以下を自動で行う：
1. `scripts/create-firebase-project.sh` で Firebase プロジェクトを作成・Hosting 設定
2. `firebase deploy` でデプロイ
3. プライバシーポリシー・利用規約を公開

#### スマホアプリの場合（IAP がある場合は事前確認を先に）

IAP（サブスクリプション）を含む場合は、以下をユーザーが確認してからリリースフローへ進む：
- App Store Connect で有料アプリ契約（Paid Apps Agreement）に署名済みか
- ASC でサブスクリプション商品が「承認済み」になっているか
- RevenueCat に Products・Offerings・Entitlements が設定済みか

確認後、AppStoreValidator → Releaser の順で実行する：

```
appstorevalidator エージェントを実行してください
releaser エージェントを実行してください
```

### 5. ファイル構成（自動生成）

```
docs/
  app-type.md           # アプリ種別（web / mobile）
  spec.md               # Planner が生成する製品仕様書
  design.md             # UIDesigner が確定するデザイン仕様書
  progress.md           # Generator が記録する実装進捗
  privacy-policy.html   # Releaser が生成するプライバシーポリシー
  terms-of-use.html     # Releaser が生成する利用規約
  feedback/
    sprint-1.md         # Evaluator が出力する評価結果
    sprint-2.md
    ...
  release/
    firebase-url.md         # Firebase 公開 URL（Web アプリ）
    certificates.md         # EAS 証明書設定（スマホアプリ）
    privacy-policy-url.md   # PP 公開 URL
    terms-of-use-url.md     # ToU 公開 URL
    metadata/               # ストアメタデータ（スマホアプリ）
    screenshots/            # スクリーンショット要件・手順（スマホアプリ）
    submit/                 # ASC・RevenueCat 申請パラメータ（スマホアプリ）
    review-checklist.md     # Apple Review チェックリスト（スマホアプリ）
.aidesigner/
  proposals.json        # UIDesigner が提案モードで保存するデザイン案一覧
  runs/                 # AIDesigner が生成した HTML アーティファクト
scripts/
  create-firebase-project.sh  # Firebase プロジェクト作成スクリプト（Web アプリ）
```

## 評価基準

| 基準 | 合格閾値 |
|---|---|
| 機能完全性 | 4/5 以上 |
| 動作安定性 | 4/5 以上 |
| UI/UX品質 | 3/5 以上 |
| エラーハンドリング | 3/5 以上 |
| 回帰なし | 5/5（必須） |
| デザイン仕様適合 | 3/5 以上（`design.md` がない場合は評価対象外） |

1つでも閾値を下回ればスプリント不合格、Generator に自動差し戻し。

## 必要な MCP サーバ

- **AIDesigner MCP** — UIDesigner がデザイン生成に使用。未接続の場合は claude.ai Design にフォールバック
- **Playwright MCP** — Evaluator がブラウザ操作テストに使用

## 絶対ルール

- **責務を越境しない** — Planner は実装しない。UIDesigner はコードを書かない。Generator は仕様・デザインを変更しない。Evaluator はコードを修正しない。AppStoreValidator は実装しない。Releaser はコード実装・仕様変更を行わない。
- スプリントは Sprint 1 → 2 → 3 の順に実装する（スキップ禁止）。
- **アプリ種別を最初に確定する** — `/docs/app-type.md` に記録してから Planner 以降を進める。
- **ユーザーがデザインを承認してから Generator を起動する。**
- 各スプリント完了時にアプリが正常に起動・動作していること。
- Generator は新スプリント着手前に、前スプリントの不合格フィードバックを先に修正する。
- **IAP を含むスマホアプリは有料アプリ契約・RevenueCat 設定を確認してから AppStoreValidator を呼び出す。**
- **全スプリント合格前に Releaser・AppStoreValidator を起動しない。**
