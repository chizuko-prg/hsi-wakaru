/**
 * 風と対地進路（Lesson 5）。
 *
 * 学習の目的は「風があると機首の向きと実際に進む方向がずれる」という概念の理解。
 * 数値の暗記教材にはしないが、内部の計算はベクトル合成で正確に行う。
 *
 * ここで求めた Track / 偏流角は、CDIやTO/FROMの判定には一切使わない。
 */

import { normalize360, signedAngleDiff, toDegrees, toRadians } from './angles';
import { unitFromBearing } from './geometry';
import type { Point, Wind } from './types';

export interface WindSolution {
  /** 対地進路。 */
  trackDeg: number;
  /** 偏流角。track - heading。右へ流されると正。 */
  driftAngleDeg: number;
  groundSpeedKt: number;
}

/** 対気ベクトルと風ベクトルを足した対地ベクトル。 */
export function groundVector(headingDeg: number, tasKt: number, wind: Wind | null): Point {
  const air = unitFromBearing(headingDeg);
  const base: Point = { x: air.x * tasKt, y: air.y * tasKt };

  if (wind === null || wind.speedKt === 0) return base;

  // 風は「吹いてくる方向」で表すので、機体が流される向きは反対側。
  const blow = unitFromBearing(wind.fromDeg + 180);
  return { x: base.x + blow.x * wind.speedKt, y: base.y + blow.y * wind.speedKt };
}

/** 機首方位と風から、実際に進む方向を求める。 */
export function solveWind(headingDeg: number, tasKt: number, wind: Wind | null): WindSolution {
  const heading = normalize360(headingDeg);

  if (wind === null || wind.speedKt === 0) {
    // 無風では Heading = Track。Lesson 5 の出発点になる状態。
    return { trackDeg: heading, driftAngleDeg: 0, groundSpeedKt: tasKt };
  }

  const ground = groundVector(heading, tasKt, wind);
  const groundSpeedKt = Math.hypot(ground.x, ground.y);

  if (groundSpeedKt === 0) {
    // 風が対気速度を完全に打ち消す極端な場合。進む方向は決まらない。
    return { trackDeg: heading, driftAngleDeg: 0, groundSpeedKt: 0 };
  }

  const trackDeg = normalize360(toDegrees(Math.atan2(ground.x, ground.y)));

  return {
    trackDeg,
    driftAngleDeg: signedAngleDiff(trackDeg, heading),
    groundSpeedKt,
  };
}

/**
 * コースをそのまま維持するために必要な機首方位。
 *
 * コース線に対する横方向の成分が消える機首方位を求める。
 * 風が対気速度より強く、横成分を打ち消せないときは null を返す。
 */
export function requiredHeadingForCourse(
  courseDeg: number,
  tasKt: number,
  wind: Wind | null,
): number | null {
  const course = normalize360(courseDeg);

  if (wind === null || wind.speedKt === 0) return course;
  if (tasKt <= 0) return null;

  // コース線に直交する向きの風成分を、機首の振りで打ち消す。
  const ratio = (wind.speedKt / tasKt) * Math.sin(toRadians(wind.fromDeg - course));
  if (Math.abs(ratio) > 1) return null;

  return normalize360(course + toDegrees(Math.asin(ratio)));
}
