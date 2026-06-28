/**
 * 複数物件の状態管理・localStorage 永続化（Sprint 2）
 *
 * 設計方針:
 * - 物件ごとに独立した入力値（FormValues）を保持する。
 * - localStorage キー `myhome-loanplan-properties` に全物件と選択中物件IDを保存する。
 * - 読み込み・保存は localStorage が使えない環境（SSR・プライベートモード等）でも
 *   クラッシュしないよう try/catch でガードする。
 */

import type { FormValues } from '../components/LoanForm';

/** 1物件分の永続データ */
export type Property = {
  /** 一意ID */
  id: string;
  /** 表示名（例: "物件1", "Aマンション"） */
  name: string;
  /** 入力値（すべて文字列。空文字 = 未入力） */
  values: FormValues;
  /** 物件情報ページの URL（空文字許容・ローン計算に非干渉）*/
  url: string;
  /** 自由記述メモ（複数行・空文字許容・ローン計算に非干渉）*/
  memo: string;
  /** 新築 / 中古 / 未選択（ローン計算に非干渉）*/
  buildingAge: 'new' | 'used' | null;
  /** 駅徒歩分数（整数の数値文字列・空文字許容・ローン計算に非干渉）*/
  walkMinutes: string;
};

/** 条件キー → 優先度（1〜5）のマップ（Sprint 7: 夫婦優先度）*/
export type PriorityMap = Record<string, number>;

/** カスタム追加条件の定義（Sprint 7）*/
export type CustomItem = { key: string; label: string };

/**
 * 夫婦優先度データ（Sprint 7）。
 * ローン計算・物件データ（properties/activeId）には一切干渉しない別系統データ。
 */
export type CoupleConditions = {
  /** 夫の優先度（条件キー → 1〜5） */
  husband: PriorityMap;
  /** 妻の優先度（条件キー → 1〜5） */
  wife: PriorityMap;
  /** カスタム追加項目の定義 */
  customItems: CustomItem[];
};

/** localStorage / Firestore に保存する全体状態 */
export type PersistState = {
  properties: Property[];
  /** 選択中物件ID（全物件削除時は null） */
  activeId: string | null;
  /** 夫婦優先度（Sprint 7・別系統データ） */
  coupleConditions: CoupleConditions;
};

export const STORAGE_KEY = 'myhome-loanplan-properties';

/** 新規物件のデフォルト入力値（物件価格・諸経費は空欄、その他は Sprint 1 と同一） */
export const DEFAULT_VALUES: FormValues = {
  price: '',
  miscCost: '',
  interestRate: '1',
  loanYears: '35',
  bonusPrincipal: '0',
  managementFee: '0',
  repairReserve: '0',
  otherFee: '0',
};

/** 一意IDを生成する（crypto.randomUUID 優先、未対応環境はフォールバック） */
export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fallthrough */
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 既存物件名から次のデフォルト名（"物件N"）を決定する。
 * "物件1", "物件3" が存在すれば "物件4" を返す（最大番号 + 1）。
 */
export function nextPropertyName(properties: Property[]): string {
  let max = 0;
  for (const p of properties) {
    const m = /^物件(\d+)$/.exec(p.name.trim());
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `物件${max + 1}`;
}

/** 新規物件を生成する */
export function createProperty(name: string): Property {
  return {
    id: createId(),
    name,
    values: { ...DEFAULT_VALUES },
    url: '',
    memo: '',
    buildingAge: null,
    walkMinutes: '',
  };
}

/** localStorage を安全に取得する（未対応時は null） */
function getStore(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    /* localStorage アクセス自体が例外（プライベートモード等） */
  }
  return null;
}

/** 空（未入力）の夫婦優先度データを返す */
export function emptyCoupleConditions(): CoupleConditions {
  return { husband: {}, wife: {}, customItems: [] };
}

/** デフォルト1物件で初期化した状態を返す */
export function createInitialState(): PersistState {
  const first = createProperty('物件1');
  return {
    properties: [first],
    activeId: first.id,
    coupleConditions: emptyCoupleConditions(),
  };
}

/** 優先度マップを正規化する（値は 1〜5 の整数のみ採用、それ以外は除外） */
function normalizePriorityMap(raw: unknown): PriorityMap {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: PriorityMap = {};
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      const n = Math.round(v);
      if (n >= 1 && n <= 5) out[key] = n;
    }
  }
  return out;
}

/** カスタム項目配列を正規化する（key/label が文字列の要素のみ採用） */
function normalizeCustomItems(raw: unknown): CustomItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomItem[] = [];
  for (const it of raw) {
    if (typeof it === 'object' && it !== null) {
      const o = it as Record<string, unknown>;
      if (typeof o.key === 'string' && typeof o.label === 'string') {
        out.push({ key: o.key, label: o.label });
      }
    }
  }
  return out;
}

/**
 * 夫婦優先度データを正規化する（Sprint 7・後方互換）。
 * 不正・欠損なら全項目未入力相当の空データ `{ husband:{}, wife:{}, customItems:[] }` を返す。
 */
export function normalizeCoupleConditions(raw: unknown): CoupleConditions {
  if (typeof raw !== 'object' || raw === null) return emptyCoupleConditions();
  const obj = raw as Record<string, unknown>;
  return {
    husband: normalizePriorityMap(obj.husband),
    wife: normalizePriorityMap(obj.wife),
    customItems: normalizeCustomItems(obj.customItems),
  };
}

/**
 * Firestore の生データ（型保証なし）に Sprint 6 以降のフィールドが欠けているか確認する。
 * 欠けている場合は保存し直してマイグレーションを完了させる必要がある。
 */
export function propertyNeedsMigration(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.url === undefined ||
    obj.memo === undefined ||
    obj.buildingAge === undefined ||
    obj.walkMinutes === undefined
  );
}

/** 1物件分のデータ整合性を検証する */
function isValidProperty(p: unknown): p is Property {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.values === 'object' &&
    obj.values !== null
  );
}

/** 保存データを FormValues の全キーが揃った形に正規化する（後方互換・欠損補完） */
function normalizeValues(values: Partial<FormValues> | undefined): FormValues {
  return { ...DEFAULT_VALUES, ...(values ?? {}) };
}

/** 駅徒歩分数を数値文字列へ正規化する（旧データが number 型の可能性にも対応）*/
function normalizeWalkMinutes(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

/**
 * 検証済み物件を、メタデータ（url/memo/buildingAge/walkMinutes）込みで
 * 全キーが揃った Property に正規化する（後方互換・欠損補完）。
 * Sprint 6 以前のデータ（メタフィールドなし）はデフォルト値で補完される。
 */
function normalizeProperty(p: Property): Property {
  const obj = p as unknown as Record<string, unknown>;
  return {
    id: p.id,
    name: p.name,
    values: normalizeValues(p.values as Partial<FormValues>),
    url: typeof obj.url === 'string' ? obj.url : '',
    memo: typeof obj.memo === 'string' ? obj.memo : '',
    buildingAge:
      obj.buildingAge === 'new' || obj.buildingAge === 'used'
        ? obj.buildingAge
        : null,
    walkMinutes: normalizeWalkMinutes(obj.walkMinutes),
  };
}

/**
 * localStorage から状態を読み込む。
 * - 保存なし / 破損 / 空配列の場合はデフォルト1物件で初期化する。
 * - activeId が物件一覧に存在しない場合は先頭物件を選択する。
 */
export function loadState(): PersistState {
  const store = getStore();
  if (!store) return createInitialState();

  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return createInitialState();
  }
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return createInitialState();

    const obj = parsed as Record<string, unknown>;
    const rawProps = Array.isArray(obj.properties) ? obj.properties : [];
    const properties: Property[] = rawProps
      .filter(isValidProperty)
      .map(normalizeProperty);

    if (properties.length === 0) {
      // 永続的に「全削除」を選んだ可能性もあるが、リロード時の初期体験を優先し
      // 物件0件かつ activeId=null が明示保存されている場合のみ空を維持する。
      const explicitlyEmpty =
        'properties' in obj &&
        Array.isArray(obj.properties) &&
        obj.properties.length === 0;
      if (explicitlyEmpty) {
        return {
          properties: [],
          activeId: null,
          coupleConditions: normalizeCoupleConditions(obj.coupleConditions),
        };
      }
      return createInitialState();
    }

    const activeIdRaw = typeof obj.activeId === 'string' ? obj.activeId : null;
    const activeId =
      activeIdRaw && properties.some((p) => p.id === activeIdRaw)
        ? activeIdRaw
        : properties[0].id;

    return {
      properties,
      activeId,
      coupleConditions: normalizeCoupleConditions(obj.coupleConditions),
    };
  } catch {
    return createInitialState();
  }
}

/**
 * 任意のパース済みオブジェクトを PersistState に正規化する。
 * Firestore から取得した `state` フィールドの検証・補完にも再利用する。
 * - properties キーが配列でない場合は null を返す（不正データ）。
 * - 空配列は「明示的な空状態」として { properties: [], activeId: null } を返す。
 * - activeId が物件一覧に存在しない場合は先頭物件を選択する。
 */
export function normalizeState(parsed: unknown): PersistState | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.properties)) return null;

  const properties: Property[] = obj.properties
    .filter(isValidProperty)
    .map(normalizeProperty);

  if (properties.length === 0) {
    return {
      properties: [],
      activeId: null,
      coupleConditions: normalizeCoupleConditions(obj.coupleConditions),
    };
  }

  const activeIdRaw = typeof obj.activeId === 'string' ? obj.activeId : null;
  const activeId =
    activeIdRaw && properties.some((p) => p.id === activeIdRaw)
      ? activeIdRaw
      : properties[0].id;

  return {
    properties,
    activeId,
    coupleConditions: normalizeCoupleConditions(obj.coupleConditions),
  };
}

/** 状態を localStorage に保存する（失敗しても例外を投げない） */
export function saveState(state: PersistState): void {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 容量超過・プライベートモード等。保存失敗は無視（UIは継続動作） */
  }
}
