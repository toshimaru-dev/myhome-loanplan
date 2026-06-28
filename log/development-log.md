# MyHome LoanPlan — 開発ログ

## プロジェクト概要

- **アプリ名**: MyHome LoanPlan（住宅ローン比較シミュレーター）
- **種別**: Web アプリ
- **公開 URL**: https://myhome-loanplan.web.app
- **GitHub**: https://github.com/toshimaru-dev/myhome-loanplan
- **Firebase プロジェクト**: myhome-loanplan
- **技術スタック**: React 18 + TypeScript + Vite 5 + TailwindCSS v3 + Firebase Firestore

---

## Sprint 1 〜 Sprint 3（前セッション完了済み）

### Sprint 1: 基盤構築・計算ロジック・単一物件シミュレーション
- `src/lib/loanCalc.ts`：元利均等返済計算（null 安全設計）
- `src/components/LoanForm.tsx`：8 フィールド入力フォーム
- `src/components/ResultCard.tsx`：グリーングラデーション結果カード
- `src/components/CurrencyInput.tsx`：3桁区切り金額入力

### Sprint 2: 複数物件管理
- `src/lib/storage.ts`：Property 型・localStorage 永続化
- `src/components/PropertyNav.tsx`：PC サイドバー + モバイルパネル

### Sprint 3: 物件比較表示・UI 仕上げ
- `src/components/CompareTable.tsx`：B デザイン（テーブル形式）比較表
- 入力/比較 切り替えタブ
- 375px 横スクロール修正（`CurrencyInput` に `min-w-0`）

---

## Sprint 4（前セッション完了済み）

### 目的
Firestore リアルタイム同期・物件名保存・諸経費 5% ボタン

### 主な変更
- `src/lib/firebase.ts`：Firebase 初期化（projectId: myhome-loanplan）
- `src/lib/firestoreStorage.ts`：`sessions/{syncId}` パスで同期コード方式
- `LoanForm.tsx`：諸経費フィールドに「5%」自動入力ボタン追加
- 同期コード（SyncBar）UI 追加

### 既知の問題（Sprint 5 で解決）
- 同期コードを手動入力しないと別端末でデータ共有できない
- localStorage と Firestore の二重管理

---

## Sprint 5: 単一共有ドキュメント方式への移行

### ユーザー要求
> ローカルストレージを一切使用せず、クラウドサービスとして提供。同期コード機能を利用しないこと。ブラウザを開くとfirestoreのデータが読み込まれる。

### 実装内容
| ファイル | 変更内容 |
|---------|---------|
| `src/lib/firestoreStorage.ts` | `shared/main` 固定パスに変更。`getSyncId`/`saveSyncId` 削除 |
| `src/App.tsx` | `syncId` state 削除・localStorage 呼び出し削除・オフライン監視追加 |
| `src/components/SyncBar.tsx` | ファイルごと削除 |
| `firestore.rules` | `shared/{docId}` への read/write 許可を追加 |

### オフラインモード
- `navigator.onLine` + `window.addEventListener('online'/'offline')` で監視
- オフライン時：画面上部に「⚠ オフライン中 — 読み取り専用」バナー（bg-muted / 白文字）
- オフライン中は全編集操作をブロック（handleChange / handleRename / handleAdd / handleDelete / handleMeta）
- オンライン復帰でバナー消去・編集再開

### Firestore データ構造（Sprint 5 以降）
```
shared/main
├── properties: Property[]   // 全物件配列
├── activeId: string | null  // 選択中物件 ID
└── updatedAt: number        // 更新タイムスタンプ
```

### 評価結果
- Sprint 5 Evaluator：**合格**（全基準が閾値以上）
- 53 テスト全通過（Sprint 5 完了時点）

### デプロイ
- Firebase Hosting: `firebase deploy --only hosting` 成功
- 公開 URL: https://myhome-loanplan.web.app
- Firestore ルール: `firebase deploy --only firestore:rules` 成功

---

## Sprint 6: 物件メタデータ（URL・メモ・物件種別・駅徒歩）

### ユーザー要求
> 物件URLの入力欄を追加。テキストメモを追加。新築か中古を選択する。駅徒歩時間を追加。その後デプロイ。

### 型変更（`src/lib/storage.ts`）
```typescript
// Property 型に追加
url: string;                        // 物件 URL（空文字許容）
memo: string;                       // テキストメモ（複数行・空文字許容）
buildingAge: 'new' | 'used' | null; // 新築/中古/未選択
walkMinutes: string;                // 駅徒歩分数（数値文字列・空文字許容）
```

### 主な変更
| ファイル | 変更内容 |
|---------|---------|
| `src/lib/storage.ts` | Property 型拡張・`createProperty()` 初期値・`normalizeProperty()` 後方互換 |
| `src/App.tsx` | `handleMeta()` ハンドラ追加（handleChange とは別経路） |
| `src/components/LoanForm.tsx` | 「物件情報」セクション追加（URL・新築/中古トグル・駅徒歩・メモ） |
| `src/components/CompareTable.tsx` | 物件種別・駅徒歩・物件 URL 行を追加 |

### デザイン判断
- 「物件情報」セクションを「ローン計算」セクションの上に配置
- 既存カード名「🏠 物件情報」→「🏠 物件価格・諸経費」にリネーム（名称衝突回避）
- 新築/中古トグル：選択中 `bg-primary text-white`、再クリックで未選択（null）に戻る
- 物件 URL：入力済みで `ExternalLink` アイコン表示・別タブで開く
- `walkMinutes` は `string` 型（既存入力フィールドと統一）

### 評価結果
- Sprint 6 Evaluator：**合格**（全基準が閾値以上）
- 53 テスト全通過

---

## バグ修正・改善（Sprint 6 デプロイ後）

### 1. ボーナス払いの月換算表示削除・独立表示化
**ユーザー要求**
> ボーナス払い（月換算）は不要で、毎月の支払額とは別で、ボーナス月にボーナスから払う金額を把握したい。

**変更（`src/components/ResultCard.tsx`）**
- グリーンカードの「ボーナス月は ¥[月々＋ボーナス合算]」バッジを削除
- ボーナス払いをアンバー色の独立カードで表示
  - 「ボーナス払い（年2回）¥○○○」
  - 「ボーナスから支払う金額」サブテキスト
- 内訳の「ボーナス払い（年2回・1回あたり）」行は独立カードと重複するため削除
- グリーンカードに「毎月の給与から支払う金額」サブテキストを追加

### 2. 既存データの自動マイグレーション
**ユーザー要求**
> 既存データも対応させて

**背景**：Sprint 6 デプロイ前に Firestore に保存された物件には `url/memo/buildingAge/walkMinutes` フィールドが存在しない。

**変更**
| ファイル | 変更内容 |
|---------|---------|
| `src/lib/storage.ts` | `propertyNeedsMigration()` 関数を追加（欠損フィールド検出） |
| `src/lib/firestoreStorage.ts` | `subscribeToState` コールバックに `needsMigration` フラグを追加 |
| `src/App.tsx` | 初回スナップショット時に `needsMigration = true` なら正規化済みデータを Firestore に保存し直す |
| `src/components/LoanForm.tsx` | `url/memo/buildingAge/walkMinutes` に `?? ''` / `?? null` フォールバック追加 |

### 3. Firestore への初期物件データ投入
**ユーザー要求**（スプレッドシートデータの投入）

| 物件名 | 価格 | 金利 | 期間 | ボーナス元金 | 管理費 | 修繕積立費 | その他 |
|--------|------|------|------|------------|--------|-----------|-------|
| ルピアコート保谷 | 7,730万 | 1.25% | 48年 | 1,500万 | 18,810 | 10,530 | 990 |
| リビオ篠崎 | 7,400万 | 1.25% | 48年 | 750万 | 23,860 | 11,900 | 1,815 |
| ルピアコート花小金井 | 5,900万 | 1.25% | 48年 | 750万 | 18,810 | 10,530 | 990 |

- Node.js スクリプト（Firebase SDK）で `shared/main` に `setDoc` で一括投入
- LDK・平米数はメモフィールドに格納（例:「3LDK 70㎡」）

### 4. iOS フォーカス時の自動ズーム抑制
**ユーザー要求**
> テキストボックスを選択した時、画面が少し拡大されて不快

**原因**：iOS Safari はフォントサイズ 16px 未満の input をフォーカスすると自動ズームする仕様。

**変更（`src/index.css`）**
```css
input, textarea, select {
  font-size: 16px;
}
```

---

## Git コミット履歴

| コミット | 内容 |
|---------|------|
| `24a6a7a` | Initial commit |
| `4b4e3d0` | アプリソース・法的文書・Firebase Hosting 設定 |
| `69534a3` | Sprint 4-5 — Firestore 共有同期・オフライン対応 |
| `01377c7` | Sprint 6 — 物件メタデータ追加 |
| `2dd430b` | Sprint 6 以前の既存データ自動マイグレーション |
| `0846eff` | ボーナス払いを月々支払いと分離 |
| `274215c` | iOS 自動ズーム抑制 |

---

## 現在の Firestore データ（`shared/main`）

```
properties[0]: ルピアコート保谷
  - price: 77300000 / miscCost: 3600000 / interestRate: 1.25 / loanYears: 48
  - bonusPrincipal: 15000000 / managementFee: 18810 / repairReserve: 10530 / otherFee: 990
  - memo: "3LDK 70㎡"

properties[1]: リビオ篠崎
  - price: 74000000 / miscCost: 3700000 / interestRate: 1.25 / loanYears: 48
  - bonusPrincipal: 7500000 / managementFee: 23860 / repairReserve: 11900 / otherFee: 1815
  - memo: "3LDK 66.12㎡"

properties[2]: ルピアコート花小金井
  - price: 59000000 / miscCost: 2950000 / interestRate: 1.25 / loanYears: 48
  - bonusPrincipal: 7500000 / managementFee: 18810 / repairReserve: 10530 / otherFee: 990
  - memo: "3LDK"
```

---

## リリース情報

| 項目 | URL |
|-----|-----|
| アプリ本体 | https://myhome-loanplan.web.app |
| プライバシーポリシー | https://toshimaru-dev.github.io/myhome-loanplan/privacy-policy.html |
| 利用規約 | https://toshimaru-dev.github.io/myhome-loanplan/terms-of-use.html |

---

## ファイル構成（主要ファイル）

```
src/
├── App.tsx                      # メインアプリ・Firestore 購読・オフライン監視
├── components/
│   ├── LoanForm.tsx             # 入力フォーム（物件情報 + ローン計算）
│   ├── ResultCard.tsx           # 計算結果カード
│   ├── CompareTable.tsx         # 物件比較テーブル
│   ├── PropertyNav.tsx          # 物件一覧ナビ（PC サイドバー + モバイルパネル）
│   ├── CurrencyInput.tsx        # 金額入力フィールド
│   └── SliderField.tsx          # スライダー入力フィールド
├── lib/
│   ├── loanCalc.ts              # 計算ロジック（純粋関数）
│   ├── storage.ts               # Property 型・正規化・localStorage
│   ├── firestoreStorage.ts      # Firestore 読み書き（shared/main）
│   └── firebase.ts              # Firebase 初期化
└── index.css                    # グローバルスタイル・iOS ズーム抑制
```
