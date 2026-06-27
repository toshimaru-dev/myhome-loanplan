import { formatNumber, formatYen, type LoanResult, type LoanInput } from '../lib/loanCalc';

interface ResultCardProps {
  input: LoanInput;
  result: LoanResult;
  /** スライダー等で入力中の生の金利・期間表示用 */
  rateText: string;
  yearsText: string;
}

function BreakdownRow({
  label,
  value,
  first,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-[8px] ${
        first ? '' : 'border-t border-border-light'
      }`}
    >
      <span className="font-rounded font-semibold text-[13px] text-muted">
        {label}
      </span>
      <span className="font-rounded font-bold text-[14px] text-ink">{value}</span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-surface rounded-[16px] px-[12px] py-[14px] text-center shadow-card">
      <div className="font-rounded font-semibold text-[11px] text-faint">
        {label}
      </div>
      <div className="font-rounded font-extrabold text-[15px] text-ink mt-[3px]">
        {value}
      </div>
    </div>
  );
}

export default function ResultCard({
  input,
  result,
  rateText,
  yearsText,
}: ResultCardProps) {
  const hasBonus =
    result.bonusPayment !== null && (result.bonusPayment ?? 0) > 0;

  // ボーナス月のお支払い = 通常月返済額 + ボーナス1回分 + 固定費
  const bonusMonthTotal =
    result.monthlyTotal !== null && result.bonusPayment !== null
      ? result.monthlyTotal + result.bonusPayment
      : null;

  return (
    <div>
      {/* 主役: グリーングラデーション結果カード */}
      <div
        className="rounded-result px-[24px] py-[32px] text-center shadow-result"
        style={{ background: 'linear-gradient(160deg, #1EB980, #138A60)' }}
      >
        <div className="font-rounded font-bold text-[13px] text-white/85">
          月々のお支払い
        </div>
        <div className="flex items-baseline justify-center gap-[2px] text-white my-[8px]">
          <span className="font-extrabold text-[26px]">¥</span>
          <span
            className="font-extrabold text-[64px] leading-none"
            style={{ letterSpacing: '-2px' }}
          >
            {formatNumber(result.monthlyTotal)}
          </span>
        </div>
        {hasBonus && bonusMonthTotal !== null && (
          <span className="inline-block font-rounded font-bold text-[12px] text-white bg-white/20 px-[14px] py-[6px] rounded-pill">
            ボーナス月は {formatYen(bonusMonthTotal)}
          </span>
        )}
      </div>

      {/* 3指標カード */}
      <div className="flex gap-[10px] mt-[18px]">
        <MetricCard label="総借入額" value={formatYen(result.fundComposition)} />
        <MetricCard
          label="金利"
          value={
            input.interestRate !== undefined && Number.isFinite(input.interestRate)
              ? `${rateText}%`
              : '—'
          }
        />
        <MetricCard
          label="返済期間"
          value={
            input.loanYears !== undefined && Number.isFinite(input.loanYears)
              ? `${yearsText}年`
              : '—'
          }
        />
      </div>

      {/* 総返済額カード */}
      <div className="flex items-center justify-between bg-surface rounded-[16px] p-[16px] mt-[14px] shadow-card">
        <span className="font-rounded font-bold text-[13px] text-muted">
          総返済額（全期間）
        </span>
        <span className="font-rounded font-extrabold text-[18px] text-ink">
          {formatYen(result.totalRepayment)}
        </span>
      </div>

      {/* 内訳明細 */}
      <div className="bg-surface rounded-bigcard p-[20px] mt-[14px] shadow-card">
        <h3 className="font-rounded font-extrabold text-[13px] text-primary mb-[6px]">
          内訳
        </h3>
        <BreakdownRow
          first
          label="通常月返済額"
          value={formatYen(result.monthlyPayment)}
        />
        <BreakdownRow
          label="ボーナス払い（月額換算）"
          value={formatYen(result.bonusMonthly)}
        />
        <BreakdownRow label="管理費" value={formatYen(input.managementFee)} />
        <BreakdownRow label="修繕積立費" value={formatYen(input.repairReserve)} />
        <BreakdownRow label="その他費用" value={formatYen(input.otherFee)} />
        <div className="mt-[6px]">
          <BreakdownRow
            first
            label="月々支払合計"
            value={formatYen(result.monthlyTotal)}
          />
        </div>
      </div>

      {/* 資金構成サマリー */}
      <div className="bg-surface rounded-[16px] p-[16px] mt-[14px] shadow-card">
        <h3 className="font-rounded font-extrabold text-[13px] text-primary mb-[6px]">
          資金構成
        </h3>
        <BreakdownRow
          first
          label="総借入額（物件価格＋諸経費）"
          value={formatYen(result.fundComposition)}
        />
        <BreakdownRow
          label="通常返済元金（ボーナス控除後）"
          value={formatYen(result.loanPrincipal)}
        />
        <BreakdownRow
          label="ボーナス元金"
          value={formatYen(input.bonusPrincipal)}
        />
      </div>
    </div>
  );
}
