/**
 * HSI判定ロジックの中心。
 *
 * 重要な原則:
 * - ラジアル・TO/FROM・CDI の計算に headingDeg を渡さない。
 *   これらは「自機の位置」と「選んだコース」だけで決まる（VORわかる？から引き継ぐ原則）。
 * - ラジアル・TO/FROM・CDI・Track を個別の状態として持たず、すべてここで導出する。
 * - レッスン画面、自由操作、計器画面はすべてこの関数を共有する。
 *
 * headingDeg を使ってよいのは次の3つだけで、いずれもCDIとは無関係:
 * - ローズの回転角（roseRotationDeg）
 * - 機首から見たコースの相対角（courseRelativeDeg / interceptAngleDeg）
 * - 風から対地進路を求めるとき（trackDeg）
 */

import { normalize360, signedAngleDiff, toDegrees, toRadians } from './angles';
import {
  CDI_CENTER_EPS,
  CDI_FULL_SCALE_DEG,
  STATION_ZONE_RADIUS,
  TO_FROM_BOUNDARY_EPS_DEG,
  TREND_PARALLEL_EPS_DEG,
} from './constants';
import { rightNormalFromBearing } from './geometry';
import type {
  CdiDirection,
  HsiDerivedState,
  HsiState,
  InterceptTrend,
  Point,
  ToFromState,
} from './types';
import { requiredHeadingForCourse, solveWind } from './wind';

/** 局から自機を見た方位。局直上ゾーンでは null。 */
export function radialFromStation(station: Point, aircraft: Point): number | null {
  const dx = aircraft.x - station.x;
  const dy = aircraft.y - station.y;

  if (Math.hypot(dx, dy) < STATION_ZONE_RADIUS) return null;

  // atan2(東成分, 北成分) により北=0度、時計回り。
  return normalize360(toDegrees(Math.atan2(dx, dy)));
}

/**
 * TO/FROM の判定。
 * 選んだコースが現在ラジアルと同じ向きに近ければ局から離れる側(FROM)、
 * 反対向きに近ければ局へ向かう側(TO)。ほぼ直角なら切替境界。
 *
 * 機首方位をこの関数へ渡してはならない。
 */
export function computeToFrom(
  radialDeg: number | null,
  courseDeg: number,
): { state: ToFromState; boundary: boolean } {
  if (radialDeg === null) return { state: 'OFF', boundary: false };

  const diff = Math.abs(signedAngleDiff(courseDeg, radialDeg));

  if (Math.abs(diff - 90) <= TO_FROM_BOUNDARY_EPS_DEG) {
    return { state: 'OFF', boundary: true };
  }

  return diff < 90 ? { state: 'FROM', boundary: false } : { state: 'TO', boundary: false };
}

/**
 * 自機の、選択コース線に対する右側方向のずれ量。
 * 正 = 自機がコースの右側 → コースは自機の左 → CDIは左。
 *
 * 機首方位をこの関数へ渡してはならない。
 */
export function aircraftRightOffset(state: HsiState): number {
  const rel = {
    x: state.aircraft.x - state.station.x,
    y: state.aircraft.y - state.station.y,
  };
  const rightNormal = rightNormalFromBearing(state.courseDeg);
  return rel.x * rightNormal.x + rel.y * rightNormal.y;
}

/** 横ずれ量から CDI の指示方向を求める。 */
export function cdiDirectionFromOffset(offset: number): CdiDirection {
  if (Math.abs(offset) <= CDI_CENTER_EPS) return 'CENTER';
  return offset > 0 ? 'LEFT' : 'RIGHT';
}

/**
 * コース線までの横距離が縮んでいるか。
 *
 * ここが Lesson 4 の要になる。
 * CDIの左右の符号だけから答えを作らず、「実際に進んでいる方向」と
 * 「コース線」の関係から求める。だから同じCDI表示でも機首が違えば答えが変わる。
 *
 * 見ているのは横距離だけで、コースと同じ向きに進んでいるかは含まない。
 */
export function computeInterceptTrend(
  offset: number,
  trackDeg: number,
  courseDeg: number,
): InterceptTrend {
  const rel = signedAngleDiff(trackDeg, courseDeg);
  const parallel =
    Math.abs(rel) < TREND_PARALLEL_EPS_DEG ||
    Math.abs(Math.abs(rel) - 180) < TREND_PARALLEL_EPS_DEG;

  // コース線と平行に進んでいるあいだは、横距離は変わらない。
  if (parallel) return 'holding';

  // すでにコース上にいて、平行でないなら離れていく。
  if (Math.abs(offset) <= CDI_CENTER_EPS) return 'opening';

  // 横方向の進み（右が正）と、いまいる側が逆なら近づいている。
  const lateral = Math.sin(toRadians(rel));
  return Math.sign(offset) * lateral < 0 ? 'closing' : 'opening';
}

/** 画面上のすべての表示は、この関数の戻り値から描く。 */
export function deriveHsiState(state: HsiState): HsiDerivedState {
  const heading = normalize360(state.headingDeg);
  const course = normalize360(state.courseDeg);

  const rel = {
    x: state.aircraft.x - state.station.x,
    y: state.aircraft.y - state.station.y,
  };
  const distance = Math.hypot(rel.x, rel.y);
  const isStationZone = distance < STATION_ZONE_RADIUS;

  const windSolution = solveWind(heading, state.tasKt, state.wind);

  // 機首方位に依存する「表示のための値」。CDI判定とは無関係。
  const courseRelativeDeg = signedAngleDiff(course, heading);
  const displayCommon = {
    roseRotationDeg: -heading,
    courseRotationDeg: course,
    courseRelativeDeg,
    interceptAngleDeg: Math.abs(courseRelativeDeg),
    trackDeg: windSolution.trackDeg,
    driftAngleDeg: windSolution.driftAngleDeg,
    groundSpeedKt: windSolution.groundSpeedKt,
    requiredHeadingDeg: requiredHeadingForCourse(course, state.tasKt, state.wind),
  };

  if (isStationZone) {
    // 局直上付近では通常の判定を行わない。
    return {
      ...displayCommon,
      distance,
      radialDeg: null,
      bearingToStationDeg: null,
      toFrom: 'OFF',
      toFromBoundary: false,
      cdiDirection: 'OFF',
      cdiDeflectionNormalized: 0,
      cdiAngularErrorDeg: null,
      crossTrackAngleDeg: null,
      isStationZone: true,
      interceptTrend: 'unknown',
    };
  }

  const radialDeg = normalize360(toDegrees(Math.atan2(rel.x, rel.y)));
  const bearingToStationDeg = normalize360(radialDeg + 180);

  const toFrom = computeToFrom(radialDeg, course);

  const offset = aircraftRightOffset(state);
  const cdiDirection = cdiDirectionFromOffset(offset);

  // 選択コース線は局を通る無限直線として扱い、そこからの角度偏差を求める。
  const ratio = Math.min(1, Math.abs(offset) / distance);
  const cdiAngularErrorDeg = toDegrees(Math.asin(ratio));

  const magnitude = Math.min(1, cdiAngularErrorDeg / CDI_FULL_SCALE_DEG);
  const sign = cdiDirection === 'CENTER' ? 0 : cdiDirection === 'LEFT' ? -1 : 1;

  return {
    ...displayCommon,
    distance,
    radialDeg,
    bearingToStationDeg,
    toFrom: toFrom.state,
    toFromBoundary: toFrom.boundary,
    cdiDirection,
    cdiDeflectionNormalized: sign * magnitude,
    cdiAngularErrorDeg,
    // 自機がコースのどちら側にいるか。CDIの指示は必ずこの反対側になる。
    crossTrackAngleDeg: cdiDirection === 'CENTER' ? 0 : Math.sign(offset) * cdiAngularErrorDeg,
    isStationZone: false,
    interceptTrend: computeInterceptTrend(offset, windSolution.trackDeg, course),
  };
}
