/**
 * 住宅ローン計算ロジック（純粋関数群）
 *
 * 設計方針:
 * - すべての計算関数は、計算に必要な入力が undefined / NaN / Infinity の
 *   いずれかを含む場合に `null` を返す（null安全設計）。
 * - 表示側は formatYen() / formatNumber() が `null` を '—' に変換する。
 * - 元利均等返済のみを対象とする（spec.md 制約事項）。
 */

export type LoanInput = {
  /** 物件価格（円） */
  price?: number;
  /** 諸経費（円） */
  miscCost?: number;
  /** 金利（%） */
  interestRate?: number;
  /** ローン期間（年） */
  loanYears?: number;
  /** ボーナス払い用の元金（円） */
  bonusPrincipal?: number;
  /** 管理費（円/月） */
  managementFee?: number;
  /** 修繕積立費（円/月） */
  repairReserve?: number;
  /** その他費用（円/月） */
  otherFee?: number;
};

export type LoanResult = {
  /** 資金構成（総借入額）= 物件価格 + 諸経費 */
  fundComposition: number | null;
  /** 通常返済元金 = 総借入額 − ボーナス元金 */
  loanPrincipal: number | null;
  /** 通常月返済額（元利均等返済） */
  monthlyPayment: number | null;
  /** ボーナス払い1回あたりの返済額（半年ごと） */
  bonusPayment: number | null;
  /** ボーナス払いの月額換算（半年額 ÷ 6） */
  bonusMonthly: number | null;
  /** 月々支払合計 = 通常月返済額 + 管理費 + 修繕積立費 + その他費用 */
  monthlyTotal: number | null;
  /** 総返済額（ローン全期間）= 通常月返済額×n + ボーナス払い×m */
  totalRepayment: number | null;
};

/** number が有限な実数値かどうかを判定する型ガード */
function isValid(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * 資金構成（総借入額）= 物件価格 + 諸経費
 */
export function calcFundComposition(input: LoanInput): number | null {
  const { price, miscCost } = input;
  if (!isValid(price) || !isValid(miscCost)) return null;
  return price + miscCost;
}

/**
 * 通常返済元金 = 総借入額 − ボーナス元金
 */
export function calcLoanPrincipal(input: LoanInput): number | null {
  const fund = calcFundComposition(input);
  const { bonusPrincipal } = input;
  if (fund === null || !isValid(bonusPrincipal)) return null;
  return fund - bonusPrincipal;
}

/**
 * 通常月返済額（元利均等返済）
 *   r = 金利(%) / 100 / 12        （月利）
 *   n = ローン期間(年) × 12        （返済回数）
 *   元金 = 総借入額 − ボーナス元金
 *   r > 0 : 元金 × r / (1 − (1+r)^(−n))
 *   r = 0 : 元金 / n
 *
 * 金利が負数、ローン期間が 0 以下などの計算不能な入力は null を返す。
 */
export function calcMonthlyPayment(input: LoanInput): number | null {
  const principal = calcLoanPrincipal(input);
  const { interestRate, loanYears } = input;

  if (principal === null) return null;
  if (!isValid(interestRate) || !isValid(loanYears)) return null;
  if (interestRate < 0 || loanYears <= 0) return null;

  const r = interestRate / 100 / 12;
  const n = loanYears * 12;

  let payment: number;
  if (r > 0) {
    payment = (principal * r) / (1 - Math.pow(1 + r, -n));
  } else {
    payment = principal / n;
  }

  return Number.isFinite(payment) ? payment : null;
}

/**
 * ボーナス払い（半年ごと元利均等返済）1回あたりの返済額
 *   r6 = 金利(%) / 100 / 2         （半年利）
 *   m  = ローン期間(年) × 2         （ボーナス返済回数）
 *   r6 > 0 : ボーナス元金 × r6 / (1 − (1+r6)^(−m))
 *   r6 = 0 : ボーナス元金 / m
 *   ボーナス元金 = 0 のとき 0
 */
export function calcBonusPayment(input: LoanInput): number | null {
  const { interestRate, loanYears, bonusPrincipal } = input;

  if (!isValid(bonusPrincipal)) return null;
  if (bonusPrincipal === 0) return 0;
  if (!isValid(interestRate) || !isValid(loanYears)) return null;
  if (interestRate < 0 || loanYears <= 0) return null;

  const r6 = interestRate / 100 / 2;
  const m = loanYears * 2;

  let payment: number;
  if (r6 > 0) {
    payment = (bonusPrincipal * r6) / (1 - Math.pow(1 + r6, -m));
  } else {
    payment = bonusPrincipal / m;
  }

  return Number.isFinite(payment) ? payment : null;
}

/**
 * ボーナス払いの月額換算（半年ごとの返済額を 1 ヶ月あたりに均す）
 *   月額換算 = 半年あたりの返済額 ÷ 6
 */
export function calcBonusMonthly(input: LoanInput): number | null {
  const bonus = calcBonusPayment(input);
  if (bonus === null) return null;
  return bonus / 6;
}

/**
 * 月々支払合計 = 通常月返済額 + 管理費 + 修繕積立費 + その他費用
 *
 * 構成要素のいずれかが算出不能（null / undefined / NaN / Infinity）の場合は
 * 合計を null（'—'）とする。
 */
export function calcMonthlyTotal(input: LoanInput): number | null {
  const monthlyPayment = calcMonthlyPayment(input);
  const { managementFee, repairReserve, otherFee } = input;

  if (monthlyPayment === null) return null;
  if (!isValid(managementFee) || !isValid(repairReserve) || !isValid(otherFee)) {
    return null;
  }

  return monthlyPayment + managementFee + repairReserve + otherFee;
}

/**
 * 総返済額（ローン全期間）= 通常月返済額 × n + ボーナス払い × m
 */
export function calcTotalRepayment(input: LoanInput): number | null {
  const monthlyPayment = calcMonthlyPayment(input);
  const bonusPayment = calcBonusPayment(input);
  const { loanYears } = input;

  if (monthlyPayment === null || bonusPayment === null) return null;
  if (!isValid(loanYears) || loanYears <= 0) return null;

  const n = loanYears * 12;
  const m = loanYears * 2;
  const total = monthlyPayment * n + bonusPayment * m;

  return Number.isFinite(total) ? total : null;
}

/**
 * 入力値からローン計算結果を一括算出する。
 */
export function calculateLoan(input: LoanInput): LoanResult {
  return {
    fundComposition: calcFundComposition(input),
    loanPrincipal: calcLoanPrincipal(input),
    monthlyPayment: calcMonthlyPayment(input),
    bonusPayment: calcBonusPayment(input),
    bonusMonthly: calcBonusMonthly(input),
    monthlyTotal: calcMonthlyTotal(input),
    totalRepayment: calcTotalRepayment(input),
  };
}

// ---------------------------------------------------------------------------
// 表示用フォーマッタ
// ---------------------------------------------------------------------------

const numberFormatter = new Intl.NumberFormat('ja-JP');

/**
 * 数値を3桁区切りの文字列に整形する。
 * null / undefined / 非有限値は '—' を返す（null安全表示）。
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return numberFormatter.format(Math.round(value));
}

/**
 * 金額を「¥1,234,567」形式に整形する。
 * null / undefined / 非有限値は '—' を返す。
 */
export function formatYen(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return `¥${numberFormatter.format(Math.round(value))}`;
}

// ---------------------------------------------------------------------------
// 入力文字列のパース
// ---------------------------------------------------------------------------

/**
 * 入力フィールドの文字列を number | undefined に変換する。
 * - 空文字 → undefined（未入力）
 * - 数値として解釈できない → NaN（計算側で null になる）
 * - カンマ・全角空白は除去する
 */
export function parseNumberInput(raw: string): number | undefined {
  const trimmed = raw.replace(/,/g, '').replace(/\s|　/g, '').trim();
  if (trimmed === '') return undefined;
  // 全角数字を半角へ
  const normalized = trimmed.replace(/[０-９．－]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  const n = Number(normalized);
  return Number.isNaN(n) ? NaN : n;
}
