import { describe, it, expect } from 'vitest';
import {
  calcFundComposition,
  calcLoanPrincipal,
  calcMonthlyPayment,
  calcBonusPayment,
  calcBonusMonthly,
  calcMonthlyTotal,
  calcTotalRepayment,
  formatNumber,
  formatYen,
  parseNumberInput,
  type LoanInput,
} from './loanCalc';

const baseInput: LoanInput = {
  price: 30_000_000,
  miscCost: 2_000_000,
  interestRate: 1.0,
  loanYears: 35,
  bonusPrincipal: 0,
  managementFee: 12_000,
  repairReserve: 8_000,
  otherFee: 0,
};

describe('calcFundComposition', () => {
  it('物件価格 + 諸経費 を返す', () => {
    expect(calcFundComposition(baseInput)).toBe(32_000_000);
  });
  it('物件価格が未入力なら null', () => {
    expect(calcFundComposition({ ...baseInput, price: undefined })).toBeNull();
  });
  it('諸経費が NaN なら null', () => {
    expect(calcFundComposition({ ...baseInput, miscCost: NaN })).toBeNull();
  });
});

describe('calcLoanPrincipal', () => {
  it('総借入額 − ボーナス元金', () => {
    expect(
      calcLoanPrincipal({ ...baseInput, bonusPrincipal: 5_000_000 })
    ).toBe(27_000_000);
  });
  it('ボーナス元金未入力なら null', () => {
    expect(
      calcLoanPrincipal({ ...baseInput, bonusPrincipal: undefined })
    ).toBeNull();
  });
});

describe('calcMonthlyPayment', () => {
  it('3,000万円・諸経費200万円・金利1.0%・35年・ボーナス0 → 約90,300円', () => {
    const v = calcMonthlyPayment(baseInput);
    expect(v).not.toBeNull();
    // 元利均等の理論値。90,000円台であることを確認
    expect(Math.round(v!)).toBeGreaterThan(90_000);
    expect(Math.round(v!)).toBeLessThan(91_000);
  });

  it('金利0%なら 元金 / 返済回数', () => {
    const v = calcMonthlyPayment({ ...baseInput, interestRate: 0 });
    // 32,000,000 / (35*12=420) = 76,190.47...
    expect(Math.round(v!)).toBe(76_190);
  });

  it('物件価格が空欄なら null', () => {
    expect(
      calcMonthlyPayment({ ...baseInput, price: undefined })
    ).toBeNull();
  });

  it('金利が負数なら計算不能で null', () => {
    expect(calcMonthlyPayment({ ...baseInput, interestRate: -1 })).toBeNull();
  });

  it('金利が NaN（文字入力相当）なら null', () => {
    expect(calcMonthlyPayment({ ...baseInput, interestRate: NaN })).toBeNull();
  });

  it('ローン期間 0 なら null（ゼロ除算回避）', () => {
    expect(calcMonthlyPayment({ ...baseInput, loanYears: 0 })).toBeNull();
  });
});

describe('calcBonusPayment', () => {
  it('ボーナス元金0なら0を返す', () => {
    expect(calcBonusPayment(baseInput)).toBe(0);
  });
  it('金利0%のボーナス払いは 元金 / 回数', () => {
    const v = calcBonusPayment({
      ...baseInput,
      bonusPrincipal: 6_000_000,
      interestRate: 0,
    });
    // 6,000,000 / (35*2=70) = 85,714.28...
    expect(Math.round(v!)).toBe(85_714);
  });
  it('金利ありのボーナス払いは正の有限値', () => {
    const v = calcBonusPayment({ ...baseInput, bonusPrincipal: 6_000_000 });
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(0);
    expect(Number.isFinite(v!)).toBe(true);
  });
  it('ボーナス元金が未入力なら null', () => {
    expect(
      calcBonusPayment({ ...baseInput, bonusPrincipal: undefined })
    ).toBeNull();
  });
});

describe('calcBonusMonthly', () => {
  it('半年額 ÷ 6 を返す', () => {
    const half = calcBonusPayment({ ...baseInput, bonusPrincipal: 6_000_000 });
    const monthly = calcBonusMonthly({ ...baseInput, bonusPrincipal: 6_000_000 });
    expect(monthly!).toBeCloseTo(half! / 6, 5);
  });
  it('ボーナス元金0なら0', () => {
    expect(calcBonusMonthly(baseInput)).toBe(0);
  });
});

describe('calcMonthlyTotal', () => {
  it('通常月返済額 + 管理費 + 修繕積立費 + その他費用 と一致する', () => {
    const monthly = calcMonthlyPayment(baseInput)!;
    const total = calcMonthlyTotal(baseInput)!;
    expect(total).toBeCloseTo(monthly + 12_000 + 8_000 + 0, 5);
  });
  it('物件価格が空欄なら合計は null', () => {
    expect(calcMonthlyTotal({ ...baseInput, price: undefined })).toBeNull();
  });
  it('固定費が未入力なら合計は null', () => {
    expect(
      calcMonthlyTotal({ ...baseInput, managementFee: undefined })
    ).toBeNull();
  });
});

describe('calcTotalRepayment', () => {
  it('正の有限値を返す', () => {
    const v = calcTotalRepayment(baseInput);
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(32_000_000);
  });
});

describe('formatNumber / formatYen', () => {
  it('3桁区切りで整形する', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatYen(1234567)).toBe('¥1,234,567');
  });
  it('null / undefined / 非有限値は — を返す', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
    expect(formatYen(null)).toBe('—');
    expect(formatYen(NaN)).toBe('—');
  });
});

describe('parseNumberInput', () => {
  it('空文字は undefined', () => {
    expect(parseNumberInput('')).toBeUndefined();
    expect(parseNumberInput('   ')).toBeUndefined();
  });
  it('カンマ付き数値をパースする', () => {
    expect(parseNumberInput('30,000,000')).toBe(30_000_000);
  });
  it('文字列は NaN を返す', () => {
    expect(Number.isNaN(parseNumberInput('abc') as number)).toBe(true);
  });
  it('負数もパースする（計算側で弾く）', () => {
    expect(parseNumberInput('-1')).toBe(-1);
  });
  it('小数をパースする', () => {
    expect(parseNumberInput('1.25')).toBe(1.25);
  });
  it('全角数字を半角に変換する', () => {
    expect(parseNumberInput('１２３')).toBe(123);
  });
});
