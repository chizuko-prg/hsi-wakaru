/**
 * 状態を日本語の文にする。
 * 色や針の位置だけに頼らず、いま何が起きているかを必ず文字でも読めるようにする。
 */

import { formatBearing } from './angles';
import type { CdiDirection, HsiDerivedState, HsiState, InterceptTrend, ToFromState } from './types';

export function cdiLabel(direction: CdiDirection, boundary = false): string {
  if (boundary) return '参考外';
  switch (direction) {
    case 'LEFT':
      return '左';
    case 'RIGHT':
      return '右';
    case 'CENTER':
      return '中央';
    case 'OFF':
      return '判定なし';
  }
}

export function toFromLabel(state: ToFromState, boundary = false): string {
  if (boundary) return '判定なし';
  switch (state) {
    case 'TO':
      return 'TO（局へ向かう側）';
    case 'FROM':
      return 'FROM（局から離れる側）';
    case 'OFF':
      return '判定なし';
  }
}

export function trendLabel(trend: InterceptTrend): string {
  switch (trend) {
    case 'closing':
      return 'コースへ近づいている';
    case 'holding':
      return 'コースとの距離は変わらない';
    case 'opening':
      return 'コースから離れている';
    case 'unknown':
      return '判定なし';
  }
}

/** 機首から見たコースの向きを、左右と角度で言い表す。 */
export function courseRelativeText(courseRelativeDeg: number): string {
  const rounded = Math.round(courseRelativeDeg);
  if (rounded === 0) return '機首とコースは同じ向き';
  if (Math.abs(rounded) === 180) return 'コースは真後ろ';
  return rounded > 0 ? `コースは右へ${rounded}°` : `コースは左へ${Math.abs(rounded)}°`;
}

/**
 * 読み上げと画面表示に使う1文。
 * 見せていない部品の話はしないよう、呼び出し側で必要な部分だけ組み立てる。
 */
export function describeHsi(
  state: HsiState,
  derived: HsiDerivedState,
  options: { cdi?: boolean; toFrom?: boolean; track?: boolean } = {},
): string {
  const parts: string[] = [
    `機首 ${formatBearing(state.headingDeg)}°`,
    `コース ${formatBearing(state.courseDeg)}°`,
    courseRelativeText(derived.courseRelativeDeg),
  ];

  if (options.cdi) {
    parts.push(`CDIは${cdiLabel(derived.cdiDirection, derived.toFromBoundary)}`);
  }
  if (options.toFrom) {
    parts.push(toFromLabel(derived.toFrom, derived.toFromBoundary));
  }
  if (options.track && derived.driftAngleDeg !== 0) {
    parts.push(`実際に進む方向 ${formatBearing(derived.trackDeg)}°`);
  }

  return `${parts.join('、')}。`;
}
