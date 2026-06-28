import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  DEFAULT_VALUES,
  createId,
  createProperty,
  nextPropertyName,
  createInitialState,
  loadState,
  saveState,
  normalizeState,
  normalizeCoupleConditions,
  emptyCoupleConditions,
  type Property,
  type PersistState,
} from './storage';

/** メモリ上の localStorage モック */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  key(i: number): string | null {
    return Array.from(this.map.keys())[i] ?? null;
  }
  get length(): number {
    return this.map.size;
  }
}

beforeEach(() => {
  const mem = new MemoryStorage();
  // window.localStorage / localStorage の両方を差し替える（テスト用にグローバルへ注入）
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = { localStorage: mem };
  g.localStorage = mem;
});

describe('createId', () => {
  it('一意なIDを返す', () => {
    const a = createId();
    const b = createId();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('createProperty', () => {
  it('指定名とデフォルト入力値を持つ物件を生成する', () => {
    const p = createProperty('テスト物件');
    expect(p.name).toBe('テスト物件');
    expect(p.values).toEqual(DEFAULT_VALUES);
    // values はコピーで、DEFAULT_VALUES と参照を共有しない
    expect(p.values).not.toBe(DEFAULT_VALUES);
    expect(p.id).toBeTruthy();
  });
});

describe('nextPropertyName', () => {
  it('空配列なら 物件1', () => {
    expect(nextPropertyName([])).toBe('物件1');
  });
  it('既存最大番号 + 1 を返す', () => {
    const props: Property[] = [
      createProperty('物件1'),
      createProperty('物件3'),
    ];
    expect(nextPropertyName(props)).toBe('物件4');
  });
  it('カスタム名のみなら 物件1', () => {
    const props: Property[] = [createProperty('Aマンション')];
    expect(nextPropertyName(props)).toBe('物件1');
  });
});

describe('saveState / loadState', () => {
  it('保存した状態をそのまま復元できる（永続化）', () => {
    const p1 = createProperty('物件1');
    p1.values = { ...DEFAULT_VALUES, price: '30000000' };
    const p2 = createProperty('Aマンション');
    p2.values = { ...DEFAULT_VALUES, price: '45000000' };
    const state: PersistState = {
      properties: [p1, p2],
      activeId: p2.id,
      coupleConditions: emptyCoupleConditions(),
    };

    saveState(state);
    const loaded = loadState();

    expect(loaded.properties).toHaveLength(2);
    expect(loaded.properties[0].values.price).toBe('30000000');
    expect(loaded.properties[1].name).toBe('Aマンション');
    expect(loaded.properties[1].values.price).toBe('45000000');
    expect(loaded.activeId).toBe(p2.id);
  });

  it('各物件の入力値が混ざらず独立して保持される', () => {
    const p1 = createProperty('物件1');
    p1.values = { ...DEFAULT_VALUES, price: '10000000', interestRate: '0.5' };
    const p2 = createProperty('物件2');
    p2.values = { ...DEFAULT_VALUES, price: '20000000', interestRate: '2.0' };
    saveState({
      properties: [p1, p2],
      activeId: p1.id,
      coupleConditions: emptyCoupleConditions(),
    });

    const loaded = loadState();
    expect(loaded.properties[0].values.price).toBe('10000000');
    expect(loaded.properties[0].values.interestRate).toBe('0.5');
    expect(loaded.properties[1].values.price).toBe('20000000');
    expect(loaded.properties[1].values.interestRate).toBe('2.0');
  });
});

describe('loadState フォールバック', () => {
  it('保存なしならデフォルト1物件で初期化する', () => {
    const loaded = loadState();
    expect(loaded.properties).toHaveLength(1);
    expect(loaded.properties[0].name).toBe('物件1');
    expect(loaded.activeId).toBe(loaded.properties[0].id);
  });

  it('破損JSONならデフォルト1物件で初期化する', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');
    const loaded = loadState();
    expect(loaded.properties).toHaveLength(1);
  });

  it('activeId が存在しない物件を指していても先頭物件を選択する', () => {
    const p1 = createProperty('物件1');
    saveState({
      properties: [p1],
      activeId: 'missing-id',
      coupleConditions: emptyCoupleConditions(),
    });
    const loaded = loadState();
    expect(loaded.activeId).toBe(p1.id);
  });

  it('明示的に全物件削除（空配列）した状態は空のまま復元する', () => {
    saveState({
      properties: [],
      activeId: null,
      coupleConditions: emptyCoupleConditions(),
    });
    const loaded = loadState();
    expect(loaded.properties).toHaveLength(0);
    expect(loaded.activeId).toBeNull();
  });

  it('欠損キーのある values をデフォルトで補完する', () => {
    const raw = JSON.stringify({
      properties: [{ id: 'x', name: '物件1', values: { price: '5000000' } }],
      activeId: 'x',
    });
    localStorage.setItem(STORAGE_KEY, raw);
    const loaded = loadState();
    expect(loaded.properties[0].values.price).toBe('5000000');
    // 欠損していた loanYears 等がデフォルトで補完される
    expect(loaded.properties[0].values.loanYears).toBe(DEFAULT_VALUES.loanYears);
    expect(loaded.properties[0].values.managementFee).toBe(
      DEFAULT_VALUES.managementFee
    );
  });
});

describe('normalizeState（Firestore データ正規化）', () => {
  it('正常な state オブジェクトをそのまま正規化する', () => {
    const p1 = createProperty('物件1');
    p1.values = { ...DEFAULT_VALUES, price: '30000000' };
    const result = normalizeState({ properties: [p1], activeId: p1.id });
    expect(result).not.toBeNull();
    expect(result!.properties).toHaveLength(1);
    expect(result!.properties[0].values.price).toBe('30000000');
    expect(result!.activeId).toBe(p1.id);
  });

  it('properties が配列でない不正データは null を返す', () => {
    expect(normalizeState({ properties: 'oops', activeId: null })).toBeNull();
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState(undefined)).toBeNull();
    expect(normalizeState(42)).toBeNull();
  });

  it('空配列は明示的な空状態として返す', () => {
    const result = normalizeState({ properties: [], activeId: null });
    expect(result).toEqual({
      properties: [],
      activeId: null,
      coupleConditions: emptyCoupleConditions(),
    });
  });

  it('存在しない activeId を指す場合は先頭物件を選択する', () => {
    const p1 = createProperty('物件1');
    const result = normalizeState({ properties: [p1], activeId: 'missing' });
    expect(result!.activeId).toBe(p1.id);
  });

  it('欠損キーのある values をデフォルトで補完する', () => {
    const result = normalizeState({
      properties: [{ id: 'x', name: '物件1', values: { price: '5000000' } }],
      activeId: 'x',
    });
    expect(result!.properties[0].values.price).toBe('5000000');
    expect(result!.properties[0].values.loanYears).toBe(
      DEFAULT_VALUES.loanYears
    );
  });

  it('不正な物件要素を除外する', () => {
    const valid = createProperty('物件1');
    const result = normalizeState({
      properties: [valid, { id: 123 }, null, 'bad'],
      activeId: valid.id,
    });
    expect(result!.properties).toHaveLength(1);
    expect(result!.properties[0].id).toBe(valid.id);
  });
});

describe('物件メタデータ（Sprint 6: url/memo/buildingAge/walkMinutes）', () => {
  it('createProperty はメタフィールドをデフォルト値で初期化する', () => {
    const p = createProperty('物件1');
    expect(p.url).toBe('');
    expect(p.memo).toBe('');
    expect(p.buildingAge).toBeNull();
    expect(p.walkMinutes).toBe('');
  });

  it('saveState/loadState でメタフィールドがそのまま永続化される', () => {
    const p = createProperty('Aマンション');
    p.url = 'https://example.com/bukken/1';
    p.memo = '南向き\n日当たり良好';
    p.buildingAge = 'used';
    p.walkMinutes = '7';
    saveState({
      properties: [p],
      activeId: p.id,
      coupleConditions: emptyCoupleConditions(),
    });

    const loaded = loadState();
    expect(loaded.properties[0].url).toBe('https://example.com/bukken/1');
    expect(loaded.properties[0].memo).toBe('南向き\n日当たり良好');
    expect(loaded.properties[0].buildingAge).toBe('used');
    expect(loaded.properties[0].walkMinutes).toBe('7');
  });

  it('normalizeState はメタフィールドを保持する', () => {
    const p = createProperty('物件1');
    p.url = 'https://example.com';
    p.buildingAge = 'new';
    p.walkMinutes = '12';
    p.memo = 'メモ';
    const result = normalizeState({ properties: [p], activeId: p.id });
    expect(result!.properties[0].url).toBe('https://example.com');
    expect(result!.properties[0].buildingAge).toBe('new');
    expect(result!.properties[0].walkMinutes).toBe('12');
    expect(result!.properties[0].memo).toBe('メモ');
  });

  it('メタフィールドを持たない旧データ（Sprint 5 以前）はデフォルト値で補完される', () => {
    const result = normalizeState({
      properties: [{ id: 'x', name: '旧物件', values: { price: '5000000' } }],
      activeId: 'x',
    });
    const prop = result!.properties[0];
    expect(prop.url).toBe('');
    expect(prop.memo).toBe('');
    expect(prop.buildingAge).toBeNull();
    expect(prop.walkMinutes).toBe('');
  });

  it('不正な buildingAge / 数値型 walkMinutes を正規化する（後方互換）', () => {
    const result = normalizeState({
      properties: [
        {
          id: 'x',
          name: '物件1',
          values: { price: '5000000' },
          buildingAge: 'invalid',
          walkMinutes: 9,
        },
      ],
      activeId: 'x',
    });
    const prop = result!.properties[0];
    // 'new'/'used' 以外は null に丸める
    expect(prop.buildingAge).toBeNull();
    // number 型は数値文字列へ変換
    expect(prop.walkMinutes).toBe('9');
  });
});

describe('夫婦優先度（Sprint 7: coupleConditions）', () => {
  it('emptyCoupleConditions は全項目未入力の空データを返す', () => {
    expect(emptyCoupleConditions()).toEqual({
      husband: {},
      wife: {},
      customItems: [],
    });
  });

  it('createInitialState に空の coupleConditions が含まれる', () => {
    const s = createInitialState();
    expect(s.coupleConditions).toEqual({
      husband: {},
      wife: {},
      customItems: [],
    });
  });

  it('normalizeCoupleConditions は正常データをそのまま採用する', () => {
    const raw = {
      husband: { station: 5, price: 3 },
      wife: { station: 2 },
      customItems: [{ key: 'custom-1', label: 'ペット可' }],
    };
    const result = normalizeCoupleConditions(raw);
    expect(result.husband.station).toBe(5);
    expect(result.husband.price).toBe(3);
    expect(result.wife.station).toBe(2);
    expect(result.customItems).toEqual([{ key: 'custom-1', label: 'ペット可' }]);
  });

  it('範囲外・非数値の優先度値を除外する', () => {
    const result = normalizeCoupleConditions({
      husband: { a: 0, b: 6, c: -1, d: 3, e: 'x' },
      wife: {},
      customItems: [],
    });
    // 1〜5 の整数のみ採用
    expect(result.husband).toEqual({ d: 3 });
  });

  it('小数の優先度値は四捨五入する', () => {
    const result = normalizeCoupleConditions({
      husband: { a: 4.4 },
      wife: { a: 2.6 },
      customItems: [],
    });
    expect(result.husband.a).toBe(4);
    expect(result.wife.a).toBe(3);
  });

  it('不正なカスタム項目を除外する', () => {
    const result = normalizeCoupleConditions({
      husband: {},
      wife: {},
      customItems: [
        { key: 'ok', label: '採用' },
        { key: 123, label: '不正キー' },
        { label: 'キー欠損' },
        null,
        'bad',
      ],
    });
    expect(result.customItems).toEqual([{ key: 'ok', label: '採用' }]);
  });

  it('coupleConditions を持たない旧データはデフォルト（空）で補完される', () => {
    const result = normalizeState({
      properties: [{ id: 'x', name: '物件1', values: { price: '5000000' } }],
      activeId: 'x',
    });
    expect(result!.coupleConditions).toEqual({
      husband: {},
      wife: {},
      customItems: [],
    });
  });

  it('normalizeState は coupleConditions を保持する', () => {
    const p = createProperty('物件1');
    const result = normalizeState({
      properties: [p],
      activeId: p.id,
      coupleConditions: {
        husband: { station: 5 },
        wife: { station: 1 },
        customItems: [{ key: 'c1', label: '眺望' }],
      },
    });
    expect(result!.coupleConditions.husband.station).toBe(5);
    expect(result!.coupleConditions.wife.station).toBe(1);
    expect(result!.coupleConditions.customItems[0].label).toBe('眺望');
  });

  it('saveState/loadState で coupleConditions が永続化される', () => {
    const p = createProperty('物件1');
    saveState({
      properties: [p],
      activeId: p.id,
      coupleConditions: {
        husband: { price: 4 },
        wife: { price: 2 },
        customItems: [{ key: 'c1', label: '庭' }],
      },
    });
    const loaded = loadState();
    expect(loaded.coupleConditions.husband.price).toBe(4);
    expect(loaded.coupleConditions.wife.price).toBe(2);
    expect(loaded.coupleConditions.customItems[0].label).toBe('庭');
  });

  it('不正な coupleConditions は空データに正規化される', () => {
    expect(normalizeCoupleConditions(null)).toEqual(emptyCoupleConditions());
    expect(normalizeCoupleConditions(undefined)).toEqual(emptyCoupleConditions());
    expect(normalizeCoupleConditions(42)).toEqual(emptyCoupleConditions());
    expect(normalizeCoupleConditions({ husband: 'oops' }).husband).toEqual({});
  });
});

describe('createInitialState', () => {
  it('物件1件・activeId 一致で初期化される', () => {
    const s = createInitialState();
    expect(s.properties).toHaveLength(1);
    expect(s.activeId).toBe(s.properties[0].id);
  });
});
