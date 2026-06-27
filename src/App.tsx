import { useEffect, useMemo, useRef, useState } from 'react';
import { ListTree, Plus, SlidersHorizontal, LayoutList, Cloud, CloudOff, WifiOff } from 'lucide-react';
import LoanForm, { type FormValues } from './components/LoanForm';
import ResultCard from './components/ResultCard';
import PropertyNav from './components/PropertyNav';
import CompareTable from './components/CompareTable';
import { calculateLoan, parseNumberInput, type LoanInput } from './lib/loanCalc';
import {
  createInitialState,
  createProperty,
  nextPropertyName,
  type PersistState,
} from './lib/storage';
import { subscribeToState, saveStateToFirestore } from './lib/firestoreStorage';

type ViewMode = 'edit' | 'compare';
type SyncStatus = 'connecting' | 'saving' | 'saved' | 'offline';

const STATUS_LABEL: Record<SyncStatus, string> = {
  connecting: '接続中…',
  saving: '保存中…',
  saved: '保存済み',
  offline: 'オフライン',
};

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

/** ブラウザの現在のオンライン状態を安全に取得する */
function getOnline(): boolean {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
  } catch {
    /* 取得不能環境ではオンライン扱い */
  }
  return true;
}

export default function App() {
  // Sprint 5: ローカル永続化を廃止。初期 state は空。データ本体は shared/main（クラウド）を正とする。
  const [state, setState] = useState<PersistState>({ properties: [], activeId: null });
  // クラウド同期の状態表示
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  // オフライン（読み取り専用）かどうか
  const [offline, setOffline] = useState<boolean>(() => !getOnline());
  // モバイルの物件一覧パネル開閉（ローカル UI 状態・共有しない）
  const [panelOpen, setPanelOpen] = useState(false);
  // 表示モード: 入力フォーム / 物件比較（ローカル UI 状態・共有しない）
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // --- 同期制御用 ref ---
  // 最新 state をクロージャに頼らず参照する（初回スナップショットでの初期化用）
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // 直前の setState がリモート由来かどうか（リモート→ローカル→再保存の無限ループ防止）
  const applyingRemoteRef = useRef(false);
  // 初回スナップショット受信後に true。これ以前は Firestore へ保存しない（リモートデータ上書き防止）
  const readyRef = useRef(false);

  // --- オンライン/オフライン監視 ---
  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setSyncStatus((s) => (s === 'offline' ? 'saved' : s));
    };
    const handleOffline = () => {
      setOffline(true);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // shared/main をリアルタイム購読する（識別子なし・全員共有）
  useEffect(() => {
    readyRef.current = false;
    setSyncStatus(getOnline() ? 'connecting' : 'offline');
    let first = true;

    const unsub = subscribeToState(
      (remote) => {
        if (first) {
          first = false;
          if (remote) {
            // 共有ドキュメントに既存データあり → それを採用
            applyingRemoteRef.current = true;
            setState(remote);
            setSyncStatus('saved');
          } else {
            // shared/main 未作成（初回） → 初期1物件を書き込んで初期化
            const init = createInitialState();
            applyingRemoteRef.current = true;
            setState(init);
            setSyncStatus('saving');
            saveStateToFirestore(init)
              .then(() => setSyncStatus('saved'))
              .catch(() => setSyncStatus('offline'));
          }
          readyRef.current = true;
          return;
        }
        // 2回目以降（他利用者の変更など）はリモートを反映
        applyingRemoteRef.current = true;
        setState(remote ?? stateRef.current);
        setSyncStatus((s) => (s === 'offline' ? s : 'saved'));
      },
      () => {
        // 通信エラーでも閲覧・計算は継続（onSnapshot のキャッシュを利用）
        readyRef.current = true;
        setSyncStatus('offline');
      }
    );

    return () => unsub();
  }, []);

  // 状態変更のたびに shared/main へ保存（ブラウザのローカル保存は使わない）
  useEffect(() => {
    // 初回スナップショット受信前、またはリモート由来の更新は再保存しない
    if (!readyRef.current) return;
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return;
    }
    // オフライン中は編集自体がブロックされるが、念のため保存もスキップ
    if (offline) return;

    setSyncStatus('saving');
    saveStateToFirestore(state)
      .then(() => setSyncStatus('saved'))
      .catch(() => setSyncStatus('offline'));
  }, [state, offline]);

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

  // --- 物件操作（オフライン中は全てブロック = 読み取り専用） ---

  const handleChange = (field: keyof FormValues, raw: string) => {
    if (offline || !active) return;
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
    if (offline || !active) return;
    setState((prev) => ({
      ...prev,
      properties: prev.properties.map((p) =>
        p.id === active.id ? { ...p, name } : p
      ),
    }));
  };

  const handleAdd = () => {
    if (offline) return;
    setState((prev) => {
      const prop = createProperty(nextPropertyName(prev.properties));
      return { properties: [...prev.properties, prop], activeId: prop.id };
    });
    setPanelOpen(false);
  };

  const handleSelect = (id: string) => {
    if (offline) return;
    setState((prev) => ({ ...prev, activeId: id }));
    setPanelOpen(false);
  };

  const handleDelete = (id: string) => {
    if (offline) return;
    setState((prev) => {
      const remaining = prev.properties.filter((p) => p.id !== id);
      const nextActive =
        prev.activeId === id ? remaining[0]?.id ?? null : prev.activeId;
      return { properties: remaining, activeId: nextActive };
    });
  };

  return (
    <div className="lg:flex min-h-full">
      {/* オフライン（読み取り専用）バナー */}
      {offline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed lg:sticky top-0 left-0 right-0 z-30 bg-muted text-white px-[18px] py-[9px] flex items-center justify-center gap-[8px] font-rounded font-bold text-[12px] shadow-icon"
        >
          <WifiOff size={15} />
          <span>⚠ オフライン中 — 読み取り専用</span>
        </div>
      )}

      {/* PC: ダーク左サイドバー（物件一覧） */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <div className={offline ? 'opacity-60 pointer-events-none' : ''}>
          <PropertyNav
            variant="sidebar"
            properties={properties}
            activeId={active?.id ?? null}
            onSelect={handleSelect}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </div>
      </aside>

      {/* メインカラム */}
      <div className="flex-1 min-w-0">
        {/* ヘッダー */}
        <header
          className={`sticky z-20 bg-bg/95 backdrop-blur-sm px-[18px] pt-[18px] pb-[10px] ${
            offline ? 'top-[37px]' : 'top-0'
          }`}
        >
          <div className="flex items-center gap-[12px] max-w-[1100px] mx-auto">
            {/* モバイル: 物件一覧トグル */}
            <button
              type="button"
              aria-label="物件一覧を開く"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((o) => !o)}
              className="lg:hidden w-[34px] h-[34px] shrink-0 rounded-full bg-surface shadow-icon flex items-center justify-center text-ink hover:bg-toggle transition-colors"
            >
              <ListTree size={18} />
            </button>

            {/* 物件名（編集可能・見出し。オフライン中は読み取り専用） */}
            {active ? (
              <input
                aria-label="物件名"
                value={active.name}
                readOnly={offline}
                onChange={(e) => handleRename(e.target.value)}
                placeholder="物件名"
                className={`flex-1 min-w-0 bg-transparent font-rounded font-extrabold text-[18px] text-ink outline-none border-b-[1.5px] border-transparent transition-colors py-[2px] ${
                  offline
                    ? 'opacity-60 cursor-default'
                    : 'focus:border-primary'
                }`}
              />
            ) : (
              <h1 className="flex-1 min-w-0 font-rounded font-extrabold text-[18px] text-faint">
                物件がありません
              </h1>
            )}

            {/* クラウド同期状態 */}
            <span
              className={`hidden sm:flex items-center gap-[4px] shrink-0 font-rounded font-semibold text-[11px] ${
                syncStatus === 'offline'
                  ? 'text-faint'
                  : syncStatus === 'saved'
                    ? 'text-primary'
                    : 'text-muted'
              }`}
              aria-live="polite"
            >
              {syncStatus === 'offline' ? (
                <CloudOff size={13} />
              ) : (
                <Cloud size={13} />
              )}
              {STATUS_LABEL[syncStatus]}
            </span>

            {/* モバイル: 物件を追加 */}
            <button
              type="button"
              aria-label="物件を追加"
              onClick={handleAdd}
              disabled={offline}
              className="lg:hidden w-[34px] h-[34px] shrink-0 rounded-full bg-primary shadow-cta flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* モバイル: 物件一覧ドロップダウンパネル */}
          {panelOpen && (
            <div className="lg:hidden max-w-[1100px] mx-auto mt-[10px]">
              <div className={offline ? 'opacity-60 pointer-events-none' : ''}>
                <PropertyNav
                  variant="panel"
                  properties={properties}
                  activeId={active?.id ?? null}
                  onSelect={handleSelect}
                  onAdd={handleAdd}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          )}
        </header>

        {/* 入力/比較 切り替えタブ（ローカル UI・オフラインでも切替可） */}
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
              <div className={offline ? 'opacity-60 pointer-events-none' : ''}>
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
            <EmptyState onAdd={handleAdd} disabled={offline} />
          )}
        </main>
      </div>
    </div>
  );
}

/** 全物件削除後の空状態（クラッシュせず新規追加できる） */
function EmptyState({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled?: boolean;
}) {
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
        disabled={disabled}
        className="inline-flex items-center justify-center gap-[6px] rounded-cta bg-primary hover:bg-primary-dark px-[24px] py-[14px] font-rounded font-extrabold text-[15px] text-white shadow-cta transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
      >
        <Plus size={18} />
        物件を追加する
      </button>
    </div>
  );
}
