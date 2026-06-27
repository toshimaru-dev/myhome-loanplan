interface CurrencyInputProps {
  id: string;
  label: string;
  /** 数値のみの文字列（例: "30000000"）。空文字は未入力。 */
  value: string;
  onChange: (rawDigits: string) => void;
  placeholder?: string;
  /** 月額単位を表示する場合のサフィックス（例: "/月"） */
  unit?: string;
  /** 入力欄の右側に表示する補助アクション（例: 「5%」自動入力ボタン） */
  action?: React.ReactNode;
}

const formatter = new Intl.NumberFormat('ja-JP');

/** 数字以外を除去し、3桁区切りで表示する金額入力フィールド */
export default function CurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  unit,
  action,
}: CurrencyInputProps) {
  const display = value === '' ? '' : formatter.format(Number(value));

  return (
    <div className="mb-[14px] last:mb-0 flex-1 min-w-0">
      <label
        htmlFor={id}
        className="block font-rounded font-semibold text-[12px] text-muted mb-[6px]"
      >
        {label}
      </label>
      <div className="flex items-center bg-bg border-[1.5px] border-border rounded-field px-[13px] py-[12px] focus-within:border-primary transition-colors">
        <span className="text-faint mr-[6px] font-bold text-[15px]">¥</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, '');
            onChange(digits);
          }}
          className="flex-1 min-w-0 bg-transparent outline-none font-rounded font-bold text-[15px] text-ink placeholder:text-faint placeholder:font-normal"
        />
        {unit && (
          <span className="ml-[6px] font-semibold text-[11px] text-faint">
            {unit}
          </span>
        )}
        {action && <div className="ml-[8px] shrink-0">{action}</div>}
      </div>
    </div>
  );
}
