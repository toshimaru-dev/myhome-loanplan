import { Home, Plus, X } from 'lucide-react';
import type { Property } from '../lib/storage';

interface PropertyNavProps {
  properties: Property[];
  activeId: string | null;
  /** 'sidebar' = PC左ダークサイドバー / 'panel' = モバイルのドロップダウンパネル */
  variant: 'sidebar' | 'panel';
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

/**
 * 物件一覧ナビゲーション。
 * - PC（lg以上）: ダーク #19231E の左サイドバー（width 200px）に常時表示。
 * - モバイル: ヘッダーの一覧ボタンで開閉するドロップダウンパネル。
 */
export default function PropertyNav({
  properties,
  activeId,
  variant,
  onSelect,
  onAdd,
  onDelete,
}: PropertyNavProps) {
  const isSidebar = variant === 'sidebar';

  // ---- PC ダークサイドバー ----
  if (isSidebar) {
    return (
      <nav
        aria-label="物件一覧"
        className="flex flex-col h-full w-[200px] bg-ink px-[16px] py-[22px]"
      >
        {/* ロゴ */}
        <div className="flex items-center gap-[10px] mb-[24px]">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-primary text-white font-rounded font-extrabold text-[14px] flex items-center justify-center">
            M
          </div>
          <span className="font-rounded font-extrabold text-[15px] text-white">
            LoanPlan
          </span>
        </div>

        <div className="font-rounded font-bold text-[11px] text-[#9BB0A6] mb-[10px] px-[12px] tracking-wide">
          物件一覧
        </div>

        <div className="flex-1 overflow-y-auto -mx-[4px] px-[4px]">
          {properties.length === 0 && (
            <p className="px-[12px] py-[8px] font-rounded font-medium text-[12px] text-[#9BB0A6]">
              物件がありません
            </p>
          )}
          <ul className="space-y-[4px]">
            {properties.map((p) => {
              const selected = p.id === activeId;
              return (
                <li key={p.id} className="group relative">
                  <button
                    type="button"
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => onSelect(p.id)}
                    className={`flex items-center w-full text-left rounded-[11px] pl-[12px] pr-[34px] py-[11px] font-rounded text-[13px] transition-colors ${
                      selected
                        ? 'bg-primary text-white font-bold'
                        : 'text-[#9BB0A6] font-semibold hover:bg-white/5'
                    }`}
                  >
                    <Home size={15} className="mr-[8px] shrink-0 opacity-80" />
                    <span className="truncate">{p.name || '（名称未設定）'}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`${p.name}を削除`}
                    onClick={() => onDelete(p.id)}
                    className={`absolute right-[8px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${
                      selected
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-[#9BB0A6] opacity-0 group-hover:opacity-100 hover:bg-white/10'
                    }`}
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-[16px] flex items-center justify-center gap-[6px] w-full rounded-[12px] bg-primary hover:bg-primary-dark py-[11px] font-rounded font-bold text-[13px] text-white transition-colors"
        >
          <Plus size={16} />
          物件を追加
        </button>
      </nav>
    );
  }

  // ---- モバイル ドロップダウンパネル ----
  return (
    <div
      aria-label="物件一覧"
      className="bg-surface rounded-card shadow-card border border-border-light overflow-hidden"
    >
      <div className="px-[16px] pt-[14px] pb-[8px] font-rounded font-extrabold text-[13px] text-primary">
        物件一覧
      </div>
      {properties.length === 0 && (
        <p className="px-[16px] pb-[12px] font-rounded font-medium text-[13px] text-muted">
          物件がありません。下のボタンから追加してください。
        </p>
      )}
      <ul>
        {properties.map((p) => {
          const selected = p.id === activeId;
          return (
            <li
              key={p.id}
              className="flex items-center border-t border-border-light first:border-t-0"
            >
              <button
                type="button"
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(p.id)}
                className="flex items-center flex-1 min-w-0 text-left px-[16px] py-[13px]"
              >
                <span
                  className={`w-[8px] h-[8px] rounded-full mr-[10px] shrink-0 ${
                    selected ? 'bg-primary' : 'bg-border'
                  }`}
                />
                <span
                  className={`truncate font-rounded text-[14px] ${
                    selected
                      ? 'font-bold text-ink'
                      : 'font-semibold text-muted'
                  }`}
                >
                  {p.name || '（名称未設定）'}
                </span>
                {selected && (
                  <span className="ml-[10px] shrink-0 font-rounded font-bold text-[10px] text-primary-dark bg-primary-light px-[8px] py-[3px] rounded-pill">
                    編集中
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-label={`${p.name}を削除`}
                onClick={() => onDelete(p.id)}
                className="mr-[10px] w-[30px] h-[30px] rounded-full flex items-center justify-center text-faint hover:text-ink hover:bg-bg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="p-[12px] border-t border-border-light">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-[6px] w-full rounded-[12px] bg-primary hover:bg-primary-dark py-[12px] font-rounded font-bold text-[14px] text-white transition-colors"
        >
          <Plus size={16} />
          物件を追加
        </button>
      </div>
    </div>
  );
}
