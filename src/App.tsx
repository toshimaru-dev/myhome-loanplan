import { useEffect, useMemo, useState } from 'react';
import { ListTree, Plus, SlidersHorizontal, LayoutList } from 'lucide-react';
import LoanForm, { type FormValues } from './components/LoanForm';
import ResultCard from './components/ResultCard';
import PropertyNav from './components/PropertyNav';
import CompareTable from './components/CompareTable';
import { calculateLoan, parseNumberInput, type LoanInput } from './lib/loanCalc';
import {
  createProperty,
  loadState,
  nextPropertyName,
  saveState,
  type PersistState,
} from './lib/storage';

type ViewMode = 'edit' | 'compare';

function toLoanInput(values: FormValues): LoanInput {
  return {
    price: parseNumberInput(values.price),
    miscCost: parseNumberInput(values.miscCost),
    interestRate: parseNumberInput(values.interestRate),
    loanYears: parseNumberInput(values.loanYears),
    bonusPrincipal: parseNumberInput(values.bonusPrincipal),
    managementFee: parseNumberInput(values.managementFee),
    repairReserve: parseNumberInput(values.repairReserve),
    otherFee: parseNumberInput(values.otherFee),
  };
}

export default function App() {
  // localStorage から復元（初回は1物件で初期化）
  const [state, setState] = useState<PersistState>(() => loadState());
  // モバイルの物件一覧パネル開閉
  const [panelOpen, setPanelOpen] = useState(false);
  // 表示モード: 入力フォーム / 物件比較
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // 状態変更のたびに永続化
  useEffect(() => {
    saveState(state);
  }, [state]);

  const { properties, activeId } = state;
  const active =
    properties.find((p) => p.id === activeId) ?? properties[0] ?? null;

  // 選択中物件の入力値 → リアルタイム計算
  const values = active?.values ?? null;
  const input = useMemo<LoanInput>(
    () => (values ? toLoanInput(values) : {}),
    [values]
  );
  const result = useMemo(() => calculateLoan(input), [input]);

  // --- 物件操作 ---

  const handleChange = (field: keyof FormValues, raw: string) => {
    if (!active) return;
    setState((prev) => ({
      ...prev,
      properties: prev.properties.map((p) =>
        p.id === active.id
          ? { ...p, values: { ...p.values, [field]: raw } }
          : p
      ),
    }));
  };

  const handleRename = (name: string) => {
    if (!active) return;
    setState((prev) => ({
      ...prev,
      properties: prev.properties.map((p) =>
        p.id === active.id ? { ...p, name } : p
      ),
    }));
  };

  const handleAdd = () => {
    setState((prev) => {
      const prop = createProperty(nextPropertyName(prev.properties));
      return { properties: [...prev.properties, prop], activeId: prop.id };
    });
    setPanelOpen(false);
  };

  const handleSelect = (id: string) => {
    setState((prev) => ({ ...prev, activeId: id }));
    setPanelOpen(false);
  };

  const handleDelete = (id: string) => {
    setState((prev) => {
      const remaining = prev.properties.filter((p) => p.id !== id);
      const nextActive =
        prev.activeId === id
          ? remaining[0]?.id ?? null
          : prev.activeId;
      return { properties: remaining, activeId: nextActive };
    });
  };

  return (
    <div className="lg:flex min-h-full">
      {/* PC: ダーク左サイドバー（物件一覧） */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <PropertyNav
          variant="sidebar"
          properties={properties}
          activeId={active?.id ?? null}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      </aside>

      {/* メインカラム */}
      <div className="flex-1 min-w-0">
        {/* ヘッダー */}
        <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm px-[18px] pt-[18px] pb-[10px]">
          <div className="flex items-center gap-[12px] max-w-[1100px] mx-auto">
            {/* モバイル: 物件一覧トグル（旧・戻るボタンを物件切替ナビに統合） */}
            <button
              type="button"
              aria-label="物件一覧を開く"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((o) => !o)}
              className="lg:hidden w-[34px] h-[34px] shrink-0 rounded-full bg-surface shadow-icon flex items-center justify-center text-ink hover:bg-toggle transition-colors"
            >
              <ListTree size={18} />
            </button>

            {/* 物件名（編集可能・見出し） */}
            {active ? (
              <input
                aria-label="物件名"
                value={active.name}
                onChange={(e) => handleRename(e.target.value)}
                placeholder="物件名"
                className="flex-1 min-w-0 bg-transparent font-rounded font-extrabold text-[18px] text-ink outline-none border-b-[1.5px] border-transparent focus:border-primary transition-colors py-[2px]"
              />
            ) : (
              <h1 className="flex-1 min-w-0 font-rounded font-extrabold text-[18px] text-faint">
                物件がありません
              </h1>
            )}

            {/* モバイル: 物件を追加 */}
            <button
              type="button"
              aria-label="物件を追加"
              onClick={handleAdd}
              className="lg:hidden w-[34px] h-[34px] shrink-0 rounded-full bg-primary shadow-cta flex items-center justify-center text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* モバイル: 物件一覧ドロップダウンパネル */}
          {panelOpen && (
            <div className="lg:hidden max-w-[1100px] mx-auto mt-[10px]">
              <PropertyNav
                variant="panel"
                properties={properties}
                activeId={active?.id ?? null}
                onSelect={handleSelect}
                onAdd={handleAdd}
                onDelete={handleDelete}
              />
            </div>
          )}
        </header>

        {/* 入力/比較 切り替えタブ */}
        <div className="px-[18px] pb-[4px] max-w-[1100px] mx-auto">
          <div className="inline-flex bg-toggle rounded-[12px] p-[4px] gap-[4px]">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-[9px] font-rounded font-bold text-[13px] transition-colors ${
                viewMode === 'edit'
                  ? 'bg-surface text-primary shadow-icon'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <SlidersHorizontal size={14} />
              入力
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-[9px] font-rounded font-bold text-[13px] transition-colors ${
                viewMode === 'compare'
                  ? 'bg-surface text-primary shadow-icon'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutList size={14} />
              比較
            </button>
          </div>
        </div>

        {/* メイン: モバイルは縦積み、PCは2カラム */}
        <main className="px-[18px] pb-[40px] pt-[8px] max-w-[1100px] mx-auto">
          {viewMode === 'compare' ? (
            <CompareTable properties={properties} />
          ) : active ? (
            <div className="lg:grid lg:grid-cols-2 lg:gap-[24px] lg:items-start">
              <div>
                <LoanForm values={active.values} onChange={handleChange} />
              </div>
              <div className="mt-[8px] lg:mt-0 lg:sticky lg:top-[80px]">
                <ResultCard
                  input={input}
                  result={result}
                  rateText={active.values.interestRate}
                  yearsText={active.values.loanYears}
                />
              </div>
            </div>
          ) : (
            <EmptyState onAdd={handleAdd} />
          )}
        </main>
      </div>
    </div>
  );
}

/** 全物件削除後の空状態（クラッシュせず新規追加できる） */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-[24px] bg-surface rounded-card shadow-card p-[32px] text-center">
      <div className="text-[40px] mb-[8px]">🏠</div>
      <h2 className="font-rounded font-extrabold text-[16px] text-ink mb-[6px]">
        物件がまだありません
      </h2>
      <p className="font-rounded font-medium text-[13px] text-muted mb-[20px]">
        物件を追加して、住宅ローンの月々支払いを試算しましょう。
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center justify-center gap-[6px] rounded-cta bg-primary hover:bg-primary-dark px-[24px] py-[14px] font-rounded font-extrabold text-[15px] text-white shadow-cta transition-colors"
      >
        <Plus size={18} />
        物件を追加する
      </button>
    </div>
  );
}
