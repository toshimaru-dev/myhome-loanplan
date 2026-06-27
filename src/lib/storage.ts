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
};

/** localStorage に保存する全体状態 */
export type PersistState = {
  properties: Property[];
  /** 選択中物件ID（全物件削除時は null） */
  activeId: string | null;
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

/** デフォルト1物件で初期化した状態を返す */
export function createInitialState(): PersistState {
  const first = createProperty('物件1');
  return { properties: [first], activeId: first.id };
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
      .map((p) => ({
        id: p.id,
        name: p.name,
        values: normalizeValues(p.values as Partial<FormValues>),
      }));

    if (properties.length === 0) {
      // 永続的に「全削除」を選んだ可能性もあるが、リロード時の初期体験を優先し
      // 物件0件かつ activeId=null が明示保存されている場合のみ空を維持する。
      const explicitlyEmpty =
        'properties' in obj &&
        Array.isArray(obj.properties) &&
        obj.properties.length === 0;
      if (explicitlyEmpty) {
        return { properties: [], activeId: null };
      }
      return createInitialState();
    }

    const activeIdRaw = typeof obj.activeId === 'string' ? obj.activeId : null;
    const activeId =
      activeIdRaw && properties.some((p) => p.id === activeIdRaw)
        ? activeIdRaw
        : properties[0].id;

    return { properties, activeId };
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
    .map((p) => ({
      id: p.id,
      name: p.name,
      values: normalizeValues(p.values as Partial<FormValues>),
    }));

  if (properties.length === 0) {
    return { properties: [], activeId: null };
  }

  const activeIdRaw = typeof obj.activeId === 'string' ? obj.activeId : null;
  const activeId =
    activeIdRaw && properties.some((p) => p.id === activeIdRaw)
      ? activeIdRaw
      : properties[0].id;

  return { properties, activeId };
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
