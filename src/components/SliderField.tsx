interface SliderFieldProps {
  id: string;
  label: string;
  /** 生の入力文字列（金利は任意テキストを許容するため number に変換しない） */
  value: string;
  onChange: (raw: string) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** 値テキストの色（金利=primary, 期間=ink） */
  valueColor?: 'primary' | 'ink';
}

/**
 * テキスト入力 + レンジスライダーを同期させた入力フィールド。
 * テキスト入力は type="text" のため、文字・負数など計算不能な値も入力でき、
 * その場合は結果側が '—' を表示する（spec 受け入れ基準）。
 */
export default function SliderField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  valueColor = 'ink',
}: SliderFieldProps) {
  const numeric = Number(value);
  const isNumber = value.trim() !== '' && Number.isFinite(numeric);
  const sliderValue = isNumber ? Math.min(Math.max(numeric, min), max) : min;
  const pct = ((sliderValue - min) / (max - min)) * 100;
  const valueClass = valueColor === 'primary' ? 'text-primary' : 'text-ink';

  return (
    <div className="mb-[14px] last:mb-0">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-rounded font-semibold text-[12px] text-muted"
        >
          {label}
        </label>
        <div className="flex items-baseline gap-[3px]">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-[64px] text-right bg-bg border-[1.5px] border-border rounded-[9px] px-[8px] py-[4px] outline-none focus:border-primary font-rounded font-extrabold text-[15px] ${valueClass}`}
          />
          <span className="font-bold text-[11px] text-faint">{unit}</span>
        </div>
      </div>

      <div className="relative my-[10px] h-[6px]">
        <div className="absolute inset-0 h-[6px] rounded-[3px] bg-border" />
        <div
          className="absolute left-0 top-0 h-[6px] rounded-[3px] bg-primary"
          style={{ width: `${pct}%` }}
        />
        <input
          aria-label={`${label}スライダー`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(e) => onChange(e.target.value)}
          className="lp-range absolute inset-0 m-0 !bg-transparent"
        />
      </div>
    </div>
  );
}
