/**
 * 夫婦優先度の固定条件項目（Sprint 7）
 *
 * 住宅購入で夫婦が重視しやすい代表的な条件を、安定したキーとともに定義する。
 * カスタム項目はこの固定11項目の下にユーザーが任意で追加できる。
 */
export const FIXED_CONDITIONS = [
  { key: 'station', label: '駅からの距離' },
  { key: 'price', label: '物件価格' },
  { key: 'size', label: '広さ・間取り' },
  { key: 'newBuilding', label: '新築かどうか' },
  { key: 'maintenance', label: '管理費・修繕積立費' },
  { key: 'sunlight', label: '日当たり・採光' },
  { key: 'storage', label: '収納の多さ' },
  { key: 'parking', label: '駐車場の有無' },
  { key: 'school', label: '学校・保育園の近さ' },
  { key: 'shopping', label: '買い物の便利さ' },
  { key: 'quiet', label: '静かさ・治安' },
] as const;
