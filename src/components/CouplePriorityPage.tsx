import { useState } from 'react';
import { Plus, X, AlertTriangle, Check } from 'lucide-react';
import { FIXED_CONDITIONS } from '../lib/coupleConditions';
import { createId, type CoupleConditions } from '../lib/storage';

interface CouplePriorityPageProps {
  conditions: CoupleConditions;
  onChange: (updated: CoupleConditions) => void;
  /** オフライン（読み取り専用）時は全編集をブロックする */
  disabled?: boolean;
}

type SubTab = 'husband' | 'wife' | 'compare';

/** 条件1件分のメタ（固定 or カスタム） */
type ConditionItem = { key: string; label: string; custom: boolean };

/** ★☆ を5個の文字列で返す（例: 値3 → "★★★☆☆"） */
function starString(value: number): string {
  const v = Math.max(0, Math.min(5, value));
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

/**
 * 夫婦優先度ページ（Sprint 7）。
 * 「夫」「妻」「比較」の3サブタブを内包する独立機能。
 * ローン計算・物件データには一切干渉しない別系統データ（coupleConditions）を扱う。
 */
export default function CouplePriorityPage({
  conditions,
  onChange,
  disabled = false,
}: CouplePriorityPageProps) {
  const [subTab, setSubTab] = useState<SubTab>('husband');
  const [newLabel, setNewLabel] = useState('');

  // 固定11項目 + カスタム項目を1つのリストに統合
  const items: ConditionItem[] = [
    ...FIXED_CONDITIONS.map((c) => ({ key: c.key, label: c.label, custom: false })),
    ...conditions.customItems.map((c) => ({ key: c.key, label: c.label, custom: true })),
  ];

  // --- 編集ハンドラ（disabled 時は何もしない） ---

  const setPriority = (person: 'husband' | 'wife', key: string, value: number) => {
    if (disabled) return;
    const map = { ...conditions[person] };
    if (value <= 0) delete map[key];
    else map[key] = value;
    onChange({ ...conditions, [person]: map });
  };

  const addCustom = () => {
    if (disabled) return;
    const label = newLabel.trim();
    if (!label) return;
    const item = { key: `custom-${createId()}`, label };
    onChange({ ...conditions, customItems: [...conditions.customItems, item] });
    setNewLabel('');
  };

  const removeCustom = (key: string) => {
    if (disabled) return;
    const husband = { ...conditions.husband };
    const wife = { ...conditions.wife };
    delete husband[key];
    delete wife[key];
    onChange({
      ...conditions,
      husband,
      wife,
      customItems: conditions.customItems.filter((c) => c.key !== key),
    });
  };

  return (
    <div className="mt-[8px]">
      {/* サブタブ: 夫 / 妻 / 比較 */}
      <div className="inline-flex bg-toggle rounded-[12px] p-[4px] gap-[4px] mb-[14px]">
        {(
          [
            { id: 'husband', label: '夫', icon: '👨' },
            { id: 'wife', label: '妻', icon: '👩' },
            { id: 'compare', label: '比較', icon: '⚖️' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            aria-current={subTab === t.id ? 'true' : undefined}
            className={`flex items-center gap-[6px] px-[18px] py-[8px] rounded-[9px] font-rounded font-bold text-[13px] transition-colors ${
              subTab === t.id
                ? 'bg-surface text-primary shadow-icon'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'compare' ? (
        <CompareView conditions={conditions} items={items} />
      ) : (
        <PersonView
          person={subTab}
          items={items}
          conditions={conditions}
          disabled={disabled}
          newLabel={newLabel}
          onNewLabel={setNewLabel}
          onSetPriority={setPriority}
          onAddCustom={addCustom}
          onRemoveCustom={removeCustom}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 夫 / 妻 入力ビュー                                                   */
/* ------------------------------------------------------------------ */

interface PersonViewProps {
  person: 'husband' | 'wife';
  items: ConditionItem[];
  conditions: CoupleConditions;
  disabled: boolean;
  newLabel: string;
  onNewLabel: (v: string) => void;
  onSetPriority: (person: 'husband' | 'wife', key: string, value: number) => void;
  onAddCustom: () => void;
  onRemoveCustom: (key: string) => void;
}

function PersonView({
  person,
  items,
  conditions,
  disabled,
  newLabel,
  onNewLabel,
  onSetPriority,
  onAddCustom,
  onRemoveCustom,
}: PersonViewProps) {
  const map = conditions[person];
  const personLabel = person === 'husband' ? '夫' : '妻';

  return (
    <div className="bg-surface rounded-card shadow-card p-[16px]">
      <div className="font-rounded font-extrabold text-[13px] text-primary mb-[4px]">
        {person === 'husband' ? '👨' : '👩'} {personLabel}の優先度
      </div>
      <p className="font-rounded font-medium text-[11px] text-faint mb-[14px]">
        各条件の重要度を ★1〜5 で設定（同じ星を再タップで未入力に戻ります）
      </p>

      <ul>
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-[10px] py-[10px] border-t border-border-light first:border-t-0"
          >
            <div className="flex items-center min-w-0 gap-[6px]">
              <span className="font-rounded font-semibold text-[13px] text-ink truncate">
                {item.label}
              </span>
              {item.custom && (
                <button
                  type="button"
                  aria-label={`${item.label}を削除`}
                  onClick={() => onRemoveCustom(item.key)}
                  disabled={disabled}
                  className="shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center text-faint hover:text-ink hover:bg-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <StarRow
              value={map[item.key] ?? 0}
              onChange={(v) => onSetPriority(person, item.key, v)}
              disabled={disabled}
              ariaLabelPrefix={`${personLabel}の${item.label}`}
            />
          </li>
        ))}
      </ul>

      {/* カスタム項目追加フォーム */}
      <div className="mt-[16px] pt-[14px] border-t border-border-light">
        <div className="font-rounded font-semibold text-[12px] text-muted mb-[6px]">
          条件を追加
        </div>
        <div className="flex gap-[8px]">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => onNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddCustom();
            }}
            disabled={disabled}
            placeholder="例: ペット可・眺望 など"
            aria-label="追加する条件名"
            className="flex-1 min-w-0 bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[10px] font-rounded font-bold text-[14px] text-ink outline-none transition-colors focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={onAddCustom}
            disabled={disabled || newLabel.trim() === ''}
            className="shrink-0 inline-flex items-center gap-[4px] rounded-[12px] bg-primary hover:bg-primary-dark px-[16px] py-[10px] font-rounded font-bold text-[13px] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            <Plus size={15} />
            追加
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ★ 行（クリック可能）                                                 */
/* ------------------------------------------------------------------ */

function StarRow({
  value,
  onChange,
  disabled,
  ariaLabelPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabelPrefix: string;
}) {
  return (
    <div className="flex items-center gap-[2px] shrink-0" role="group">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${ariaLabelPrefix} 優先度${n}`}
            aria-pressed={filled}
            disabled={disabled}
            onClick={() => onChange(value === n ? 0 : n)}
            className={`text-[22px] leading-none transition-transform ${
              filled ? 'text-primary' : 'text-border'
            } ${
              disabled
                ? 'cursor-not-allowed'
                : 'hover:scale-110 active:scale-95 cursor-pointer'
            }`}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 比較ビュー                                                           */
/* ------------------------------------------------------------------ */

function CompareView({
  conditions,
  items,
}: {
  conditions: CoupleConditions;
  items: ConditionItem[];
}) {
  return (
    <div className="bg-surface rounded-card shadow-card overflow-hidden">
      <div className="px-[16px] pt-[14px] pb-[4px]">
        <div className="font-rounded font-extrabold text-[13px] text-primary">
          ⚖️ 夫婦の優先度比較
        </div>
        <p className="font-rounded font-medium text-[11px] text-faint mt-[2px]">
          差が ★2 以上の項目は「意見が分かれている」として強調表示されます
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-ink">
              <th className="text-left px-[14px] py-[11px] font-rounded font-bold text-[11px] text-[#9BB0A6] w-[34%]">
                条件
              </th>
              <th className="px-[8px] py-[11px] font-rounded font-bold text-[12px] text-white text-center">
                👨 夫
              </th>
              <th className="px-[8px] py-[11px] font-rounded font-bold text-[12px] text-white text-center">
                👩 妻
              </th>
              <th className="px-[8px] py-[11px] font-rounded font-bold text-[11px] text-[#9BB0A6] text-center w-[56px]">
                差
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const h = conditions.husband[item.key] ?? 0;
              const w = conditions.wife[item.key] ?? 0;
              const bothEmpty = h === 0 && w === 0;
              const diff = Math.abs(h - w);
              const big = !bothEmpty && diff >= 2;
              const match = !bothEmpty && diff === 0;

              return (
                <tr
                  key={item.key}
                  className={
                    big
                      ? 'bg-amber-50 border-l-2 border-amber-400'
                      : idx % 2 === 1
                        ? 'bg-rowalt'
                        : 'bg-surface'
                  }
                >
                  <td className="px-[14px] py-[11px] font-rounded font-semibold text-[13px] text-ink">
                    {item.label}
                  </td>
                  <td className="px-[8px] py-[11px] text-center whitespace-nowrap font-rounded text-[14px] tracking-[1px] text-primary">
                    {h === 0 ? (
                      <span className="text-faint text-[12px] tracking-normal">
                        未入力
                      </span>
                    ) : (
                      starString(h)
                    )}
                  </td>
                  <td className="px-[8px] py-[11px] text-center whitespace-nowrap font-rounded text-[14px] tracking-[1px] text-primary">
                    {w === 0 ? (
                      <span className="text-faint text-[12px] tracking-normal">
                        未入力
                      </span>
                    ) : (
                      starString(w)
                    )}
                  </td>
                  <td className="px-[8px] py-[11px] text-center">
                    {big ? (
                      <span
                        className="inline-flex items-center justify-center text-amber-500"
                        title={`差 ${diff}・意見が分かれています`}
                        aria-label={`差 ${diff}、意見が分かれています`}
                      >
                        <AlertTriangle size={16} />
                      </span>
                    ) : match ? (
                      <span
                        className="inline-flex items-center justify-center text-primary"
                        title="一致"
                        aria-label="一致"
                      >
                        <Check size={16} />
                      </span>
                    ) : bothEmpty ? (
                      <span className="text-faint text-[13px]">—</span>
                    ) : (
                      <span className="font-rounded font-bold text-[12px] text-muted">
                        {diff}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
