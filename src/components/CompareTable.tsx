import { useMemo } from 'react';
import type { Property } from '../lib/storage';
import {
  calculateLoan,
  formatYen,
  parseNumberInput,
  type LoanInput,
  type LoanResult,
} from '../lib/loanCalc';

interface CompareTableProps {
  properties: Property[];
}

function toInput(values: Property['values']): LoanInput {
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

function fmtRate(values: Property['values']): string {
  const n = parseNumberInput(values.interestRate);
  return n !== undefined && Number.isFinite(n) ? `${values.interestRate}%` : '—';
}

function fmtYears(values: Property['values']): string {
  const n = parseNumberInput(values.loanYears);
  return n !== undefined && Number.isFinite(n) ? `${values.loanYears}年` : '—';
}

/** 物件種別（新築/中古/未選択）の表示文字列 */
function fmtBuildingAge(p: Property): string {
  if (p.buildingAge === 'new') return '新築';
  if (p.buildingAge === 'used') return '中古';
  return '—';
}

/** 駅徒歩分数の表示文字列 */
function fmtWalk(p: Property): string {
  const w = (p.walkMinutes ?? '').trim();
  return w !== '' ? `${w}分` : '—';
}

/** URL を比較表向けに 30 文字へ短縮する（リンク自体はフル URL を保持） */
function shortenUrl(url: string): string {
  const u = url.trim();
  if (u.length <= 30) return u;
  return `${u.slice(0, 30)}…`;
}

/** 物件メタ情報の行数（データ行の交互背景オフセットに使用） */
const META_ROW_COUNT = 3;

type Entry = { property: Property; input: LoanInput; result: LoanResult };

type RowDef = { label: string; getValue: (e: Entry) => string };

/** 物件メタ情報のうち、単純なテキスト表示で済む行（URL は別途リンクで描画） */
const META_TEXT_ROWS: { label: string; getValue: (p: Property) => string }[] = [
  { label: '物件種別', getValue: fmtBuildingAge },
  { label: '駅徒歩', getValue: fmtWalk },
];

const ROWS: RowDef[] = [
  { label: '物件価格', getValue: (e) => formatYen(e.input.price) },
  { label: '諸経費', getValue: (e) => formatYen(e.input.miscCost) },
  { label: '総借入額', getValue: (e) => formatYen(e.result.fundComposition) },
  { label: '金利', getValue: (e) => fmtRate(e.property.values) },
  { label: '返済期間', getValue: (e) => fmtYears(e.property.values) },
  { label: 'ボーナス払い（月換算）', getValue: (e) => formatYen(e.result.bonusMonthly) },
  { label: '管理費', getValue: (e) => formatYen(e.input.managementFee) },
  { label: '修繕積立費', getValue: (e) => formatYen(e.input.repairReserve) },
  { label: 'その他費用', getValue: (e) => formatYen(e.input.otherFee) },
  { label: '総返済額（全期間）', getValue: (e) => formatYen(e.result.totalRepayment) },
];

export default function CompareTable({ properties }: CompareTableProps) {
  const entries = useMemo<Entry[]>(
    () =>
      properties.map((p) => {
        const input = toInput(p.values);
        const result = calculateLoan(input);
        return { property: p, input, result };
      }),
    [properties]
  );

  if (properties.length === 0) {
    return (
      <div className="mt-[24px] bg-surface rounded-card shadow-card p-[32px] text-center">
        <p className="font-rounded font-medium text-[13px] text-muted">
          物件を追加すると比較できます。
        </p>
      </div>
    );
  }

  const minTotal = entries.reduce<number | null>((min, e) => {
    const v = e.result.monthlyTotal;
    if (v === null) return min;
    return min === null || v < min ? v : min;
  }, null);

  const LABEL_W = 92;
  const COL_W = 130;
  const tableMinWidth = LABEL_W + COL_W * properties.length;

  return (
    <div className="mt-[8px] overflow-x-auto rounded-card shadow-card">
      <table
        className="w-full border-collapse"
        style={{ minWidth: `${tableMinWidth}px` }}
      >
        <thead>
          {/* 物件名ヘッダー行 */}
          <tr style={{ background: '#19231E' }}>
            <th
              className="font-rounded font-bold text-[11px] px-[12px] py-[14px] text-left"
              style={{ width: `${LABEL_W}px`, minWidth: `${LABEL_W}px`, color: '#9BB0A6' }}
            >
              物件
            </th>
            {entries.map(({ property }) => (
              <th
                key={property.id}
                className="font-rounded font-extrabold text-[12px] text-white px-[8px] py-[14px] text-center leading-tight"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
              >
                {property.name}
              </th>
            ))}
          </tr>
          {/* 月々支払合計ハイライト行 */}
          <tr style={{ background: '#E4F6EE' }}>
            <td
              className="font-rounded font-bold text-[11px] px-[12px] py-[14px] text-left"
              style={{ color: '#138A60' }}
            >
              月々
            </td>
            {entries.map(({ property, result }) => {
              const isMin =
                result.monthlyTotal !== null &&
                result.monthlyTotal === minTotal &&
                properties.length > 1;
              return (
                <td
                  key={property.id}
                  className="px-[8px] py-[14px] text-center"
                  style={{ borderLeft: '1px solid #fff' }}
                >
                  <div
                    className="font-rounded font-extrabold text-[16px]"
                    style={{ color: isMin ? '#138A60' : '#19231E' }}
                  >
                    {formatYen(result.monthlyTotal)}
                  </div>
                  {isMin && (
                    <div
                      className="font-rounded font-bold text-[9px] mt-[2px]"
                      style={{ color: '#1EB980' }}
                    >
                      最安 ✓
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* 物件メタ情報（種別・駅徒歩） — ローン計算に非干渉。データ行の上部に配置 */}
          {META_TEXT_ROWS.map((row, idx) => (
            <tr
              key={row.label}
              style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFA' }}
            >
              <td
                className="font-rounded font-semibold text-[11px] text-faint px-[12px] py-[13px] text-left"
                style={{ borderTop: '1px solid #F0F3EF' }}
              >
                {row.label}
              </td>
              {entries.map(({ property }) => (
                <td
                  key={property.id}
                  className="font-rounded font-bold text-[13px] text-ink px-[8px] py-[13px] text-center"
                  style={{
                    borderLeft: '1px solid #F0F3EF',
                    borderTop: '1px solid #F0F3EF',
                  }}
                >
                  {row.getValue(property)}
                </td>
              ))}
            </tr>
          ))}

          {/* 物件URL（短縮表示 + 別タブで開けるリンク） */}
          <tr style={{ background: META_TEXT_ROWS.length % 2 === 0 ? '#fff' : '#FAFBFA' }}>
            <td
              className="font-rounded font-semibold text-[11px] text-faint px-[12px] py-[13px] text-left"
              style={{ borderTop: '1px solid #F0F3EF' }}
            >
              物件URL
            </td>
            {entries.map(({ property }) => {
              const url = (property.url ?? '').trim();
              return (
                <td
                  key={property.id}
                  className="font-rounded font-bold text-[13px] text-ink px-[8px] py-[13px] text-center"
                  style={{
                    borderLeft: '1px solid #F0F3EF',
                    borderTop: '1px solid #F0F3EF',
                  }}
                >
                  {url !== '' ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark underline break-all"
                      title={url}
                    >
                      {shortenUrl(url)}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              );
            })}
          </tr>

          {/* ローン計算の各指標（メタ行の分だけ交互背景をオフセット） */}
          {ROWS.map((row, idx) => (
            <tr
              key={row.label}
              style={{
                background: (idx + META_ROW_COUNT) % 2 === 0 ? '#fff' : '#FAFBFA',
              }}
            >
              <td
                className="font-rounded font-semibold text-[11px] text-faint px-[12px] py-[13px] text-left"
                style={{ borderTop: '1px solid #F0F3EF' }}
              >
                {row.label}
              </td>
              {entries.map(({ property, ...rest }) => (
                <td
                  key={property.id}
                  className="font-rounded font-bold text-[13px] text-ink px-[8px] py-[13px] text-center"
                  style={{
                    borderLeft: '1px solid #F0F3EF',
                    borderTop: '1px solid #F0F3EF',
                  }}
                >
                  {row.getValue({ property, ...rest })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
