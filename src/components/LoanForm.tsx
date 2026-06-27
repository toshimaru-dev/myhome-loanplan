import { Globe, ExternalLink } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import SliderField from './SliderField';
import type { Property } from '../lib/storage';

/** フォームが保持する生入力（すべて文字列。空文字 = 未入力） */
export type FormValues = {
  price: string;
  miscCost: string;
  interestRate: string;
  loanYears: string;
  bonusPrincipal: string;
  managementFee: string;
  repairReserve: string;
  otherFee: string;
};

/** 物件メタデータの更新フィールド（ローン計算に非干渉） */
export type MetaField = 'url' | 'memo' | 'buildingAge' | 'walkMinutes';

interface LoanFormProps {
  values: FormValues;
  onChange: (field: keyof FormValues, raw: string) => void;
  /** 選択中物件（メタデータの表示・編集に使用） */
  property: Property;
  /** メタデータ更新ハンドラ */
  onMeta: (field: MetaField, value: string | 'new' | 'used' | null) => void;
  /** オフライン（読み取り専用）時に true。物件情報フィールドを無効化する */
  disabled?: boolean;
}

/** セクション見出し（物件情報 / ローン計算） */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-rounded font-extrabold text-[13px] text-primary mb-[10px]">
      {children}
    </h2>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface rounded-card p-[16px] shadow-card mb-[14px]">
      <h3 className="font-rounded font-extrabold text-[13px] text-primary mb-[14px]">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export default function LoanForm({
  values,
  onChange,
  property,
  onMeta,
  disabled = false,
}: LoanFormProps) {
  // 物件価格が未入力ならボタンを無効化（クラッシュ防止）
  const priceEmpty = values.price.trim() === '';

  const fillMiscCost5pct = () => {
    const price = Number(values.price);
    if (!Number.isFinite(price) || price <= 0) return;
    // 物件価格 × 5%（端数は四捨五入し整数の円で格納）
    onChange('miscCost', String(Math.round(price * 0.05)));
  };

  const hasUrl = (property.url ?? '').trim() !== '';

  return (
    <div>
      {/* === 物件情報（メタデータ・ローン計算に非干渉） === */}
      <SectionHeading>物件情報</SectionHeading>
      <section className="bg-surface rounded-card p-[16px] shadow-card mb-[14px]">
        {/* 物件URL */}
        <div className="mb-[14px]">
          <label
            htmlFor="prop-url"
            className="flex items-center gap-[6px] font-rounded font-semibold text-[12px] text-muted mb-[6px]"
          >
            物件URL
            {hasUrl && (
              <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="物件URLを新しいタブで開く"
                title="物件ページを開く"
                className="text-primary hover:text-primary-dark transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </label>
          <div className="flex items-center bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[12px] focus-within:border-primary transition-colors">
            <Globe size={15} className="text-faint mr-[6px] shrink-0" />
            <input
              id="prop-url"
              type="text"
              inputMode="url"
              value={property.url ?? ''}
              disabled={disabled}
              placeholder="https://..."
              onChange={(e) => onMeta('url', e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none font-rounded font-bold text-[15px] text-ink placeholder:text-faint placeholder:font-normal disabled:opacity-60"
            />
          </div>
        </div>

        {/* 新築 / 中古 トグル（未選択を許容） */}
        <div className="mb-[14px]">
          <span className="block font-rounded font-semibold text-[12px] text-muted mb-[6px]">
            新築 / 中古
          </span>
          <div className="flex gap-[8px]">
            {([
              ['new', '新築'],
              ['used', '中古'],
            ] as const).map(([val, label]) => {
              const selected = (property.buildingAge ?? null) === val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  // 選択中タブを再クリックで未選択（null）に戻せる
                  onClick={() => onMeta('buildingAge', selected ? null : val)}
                  className={`flex-1 rounded-field px-[13px] py-[10px] font-rounded font-bold text-[14px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-primary text-white'
                      : 'bg-toggle text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 駅徒歩（整数・分） */}
        <div className="mb-[14px]">
          <label
            htmlFor="prop-walk"
            className="block font-rounded font-semibold text-[12px] text-muted mb-[6px]"
          >
            駅徒歩
          </label>
          <div className="flex items-center bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[12px] focus-within:border-primary transition-colors">
            <input
              id="prop-walk"
              type="text"
              inputMode="numeric"
              value={property.walkMinutes ?? ''}
              disabled={disabled}
              placeholder="10"
              onChange={(e) =>
                onMeta('walkMinutes', e.target.value.replace(/[^\d]/g, ''))
              }
              className="flex-1 min-w-0 bg-transparent outline-none font-rounded font-bold text-[15px] text-ink placeholder:text-faint placeholder:font-normal disabled:opacity-60"
            />
            <span className="ml-[6px] font-semibold text-[11px] text-faint">
              分
            </span>
          </div>
        </div>

        {/* テキストメモ（複数行・改行保持） */}
        <div>
          <label
            htmlFor="prop-memo"
            className="block font-rounded font-semibold text-[12px] text-muted mb-[6px]"
          >
            メモ
          </label>
          <textarea
            id="prop-memo"
            rows={3}
            value={property.memo ?? ''}
            disabled={disabled}
            placeholder="気になる点・周辺環境・内見メモなど"
            onChange={(e) => onMeta('memo', e.target.value)}
            className="w-full bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[12px] focus:outline-none focus:border-primary focus-within:border-primary font-rounded text-[15px] text-ink placeholder:text-faint placeholder:font-normal resize-y disabled:opacity-60"
          />
        </div>
      </section>

      {/* === ローン計算 === */}
      <SectionHeading>ローン計算</SectionHeading>
      <Card icon="🏠" title="物件価格・諸経費">
        <CurrencyInput
          id="price"
          label="物件価格"
          value={values.price}
          onChange={(v) => onChange('price', v)}
          placeholder="30,000,000"
        />
        <CurrencyInput
          id="miscCost"
          label="諸経費"
          value={values.miscCost}
          onChange={(v) => onChange('miscCost', v)}
          placeholder="2,000,000"
          action={
            <button
              type="button"
              onClick={fillMiscCost5pct}
              disabled={priceEmpty}
              aria-label="物件価格の5%を諸経費に入力"
              title="物件価格の5%を自動入力"
              className="font-rounded font-bold text-[11px] px-[8px] py-[6px] rounded-[8px] bg-primary-light text-primary-dark hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-light disabled:hover:text-primary-dark"
            >
              5%
            </button>
          }
        />
      </Card>

      <Card icon="💰" title="借入条件">
        <SliderField
          id="interestRate"
          label="金利"
          value={values.interestRate}
          onChange={(v) => onChange('interestRate', v)}
          min={0}
          max={5}
          step={0.05}
          unit="%"
          valueColor="primary"
        />
        <SliderField
          id="loanYears"
          label="返済期間"
          value={values.loanYears}
          onChange={(v) => onChange('loanYears', v)}
          min={1}
          max={50}
          step={1}
          unit="年"
          valueColor="ink"
        />
      </Card>

      <Card icon="📋" title="ボーナス・その他費用">
        <CurrencyInput
          id="bonusPrincipal"
          label="ボーナス元金"
          value={values.bonusPrincipal}
          onChange={(v) => onChange('bonusPrincipal', v)}
          placeholder="0"
        />
        <div className="flex gap-[10px]">
          <CurrencyInput
            id="managementFee"
            label="管理費"
            value={values.managementFee}
            onChange={(v) => onChange('managementFee', v)}
            placeholder="0"
            unit="/月"
          />
          <CurrencyInput
            id="repairReserve"
            label="修繕積立費"
            value={values.repairReserve}
            onChange={(v) => onChange('repairReserve', v)}
            placeholder="0"
            unit="/月"
          />
        </div>
        <CurrencyInput
          id="otherFee"
          label="その他費用"
          value={values.otherFee}
          onChange={(v) => onChange('otherFee', v)}
          placeholder="0"
          unit="/月"
        />
      </Card>
    </div>
  );
}
