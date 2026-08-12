/**
 * HsiState を保持し、操作をまとめる。
 * 判定は必ず deriveHsiState に委ね、ここでラジアルやCDIを持たない。
 *
 * Heading と Course は独立した値として持つ。
 * 片方を動かしても、もう片方を書き換えてはならない（Lesson 2 の学習内容そのもの）。
 */

import { useCallback, useMemo, useState } from 'react';
import { normalize360 } from '../domain/hsi/angles';
import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from '../domain/hsi/constants';
import { deriveHsiState, radialFromStation } from '../domain/hsi/deriveHsiState';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiDerivedState, HsiState, Point, Wind } from '../domain/hsi/types';

const STATION: Point = { x: 0, y: 0 };

export const DEFAULT_HSI_STATE: HsiState = {
  station: STATION,
  // 局の南にいて、北へ向かうコースの上にいる状態から始める。
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export interface HsiController {
  state: HsiState;
  derived: HsiDerivedState;
  setHeading: (deg: number) => void;
  setCourse: (deg: number) => void;
  /** 局から見た自機の方向を指定して置き直す。 */
  setAircraftRadial: (radialDeg: number, distance?: number) => void;
  setWind: (wind: Wind | null) => void;
  /** 機首を相対角度で回す。連続操作でも取りこぼさない。 */
  nudgeHeading: (deltaDeg: number) => void;
  /** コースを相対角度で回す。 */
  nudgeCourse: (deltaDeg: number) => void;
  reset: (next?: Partial<HsiState>) => void;
}

/**
 * 自機位置を、局から見た方向として読み直す。位置スライダーの表示に使う。
 *
 * 派生値ではなく状態から直接求める。
 * 「この手順の初期位置」のように、いまの派生値と対応しない状態を渡すことがあるため。
 */
export function aircraftRadialOf(state: HsiState): number {
  return (
    radialFromStation(state.station, state.aircraft) ?? normalize360(state.courseDeg + 180)
  );
}

export function useHsiState(initial: Partial<HsiState> = {}): HsiController {
  const [state, setState] = useState<HsiState>({ ...DEFAULT_HSI_STATE, ...initial });

  const derived = useMemo(() => deriveHsiState(state), [state]);

  const setHeading = useCallback((deg: number) => {
    // course には触れない。
    setState((prev) => ({ ...prev, headingDeg: normalize360(deg) }));
  }, []);

  const setCourse = useCallback((deg: number) => {
    // headingDeg には触れない。
    setState((prev) => ({ ...prev, courseDeg: normalize360(deg) }));
  }, []);

  const setAircraftRadial = useCallback((radialDeg: number, distance = DEFAULT_DISTANCE) => {
    setState((prev) => ({
      ...prev,
      aircraft: pointFromRadial(prev.station, radialDeg, distance),
    }));
  }, []);

  const setWind = useCallback((wind: Wind | null) => {
    setState((prev) => ({ ...prev, wind }));
  }, []);

  const nudgeHeading = useCallback((deltaDeg: number) => {
    setState((prev) => ({ ...prev, headingDeg: normalize360(prev.headingDeg + deltaDeg) }));
  }, []);

  const nudgeCourse = useCallback((deltaDeg: number) => {
    setState((prev) => ({ ...prev, courseDeg: normalize360(prev.courseDeg + deltaDeg) }));
  }, []);

  const reset = useCallback((next: Partial<HsiState> = {}) => {
    setState({ ...DEFAULT_HSI_STATE, ...next });
  }, []);

  return {
    state,
    derived,
    setHeading,
    setCourse,
    setAircraftRadial,
    setWind,
    nudgeHeading,
    nudgeCourse,
    reset,
  };
}
