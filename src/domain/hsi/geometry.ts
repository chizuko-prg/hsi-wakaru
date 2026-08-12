/**
 * 世界座標の計算。東が +x、北が +y。
 * 画面座標（yが下向き）への変換は表示側で行い、ここには持ち込まない。
 */

import { toRadians } from './angles';
import type { Point } from './types';

/** 方位の単位ベクトル。北=0度、時計回り。 */
export function unitFromBearing(bearingDeg: number): Point {
  const rad = toRadians(bearingDeg);
  return { x: Math.sin(rad), y: Math.cos(rad) };
}

/** origin から bearingDeg の方向へ distance 進んだ点。 */
export function pointFromRadial(origin: Point, bearingDeg: number, distance: number): Point {
  const unit = unitFromBearing(bearingDeg);
  return { x: origin.x + unit.x * distance, y: origin.y + unit.y * distance };
}

/** 方位に対して右90度を向く単位ベクトル。 */
export function rightNormalFromBearing(bearingDeg: number): Point {
  return unitFromBearing(bearingDeg + 90);
}
