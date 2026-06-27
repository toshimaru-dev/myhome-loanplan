import CurrencyInput from './CurrencyInput';
import SliderField from './SliderField';

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

interface LoanFormProps {
  values: FormValues;
  onChange: (field: keyof FormValues, raw: string) => void;
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
      <h2 className="font-rounded font-extrabold text-[13px] text-primary mb-[14px]">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

export default function LoanForm({ values, onChange }: LoanFormProps) {
  // 物件価格が未入力ならボタンを無効化（クラッシュ防止）
  const priceEmpty = values.price.trim() === '';

  const fillMiscCost5pct = () => {
    const price = Number(values.price);
    if (!Number.isFinite(price) || price <= 0) return;
    // 物件価格 × 5%（端数は四捨五入し整数の円で格納）
    onChange('miscCost', String(Math.round(price * 0.05)));
  };

  return (
    <div>
      <Card icon="🏠" title="物件情報">
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
