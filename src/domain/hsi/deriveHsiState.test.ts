import { describe, expect, it } from 'vitest';
import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from './constants';
import { computeInterceptTrend, deriveHsiState } from './deriveHsiState';
import { pointFromRadial } from './geometry';
import type { HsiState, Point } from './types';

const STATION: Point = { x: 0, y: 0 };

function makeState(overrides: Partial<HsiState> = {}): HsiState {
  return {
    station: STATION,
    aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
    headingDeg: 0,
    courseDeg: 360,
    wind: null,
    tasKt: DEFAULT_TAS_KT,
    ...overrides,
  };
}

describe('機首方位は判定に影響しない', () => {
  it('Headingを一周させても、ラジアル・TO/FROM・CDIは変わらない', () => {
    const base = makeState({
      aircraft: { x: 2, y: -20 },
      courseDeg: 360,
    });
    const reference = deriveHsiState(base);

    for (let heading = 0; heading < 360; heading += 10) {
      const derived = deriveHsiState({ ...base, headingDeg: heading });

      expect(derived.radialDeg).toBe(reference.radialDeg);
      expect(derived.bearingToStationDeg).toBe(reference.bearingToStationDeg);
      expect(derived.toFrom).toBe(reference.toFrom);
      expect(derived.toFromBoundary).toBe(reference.toFromBoundary);
      expect(derived.cdiDirection).toBe(reference.cdiDirection);
      expect(derived.cdiDeflectionNormalized).toBe(reference.cdiDeflectionNormalized);
      expect(derived.cdiAngularErrorDeg).toBe(reference.cdiAngularErrorDeg);
    }
  });
});

describe('表示の回転量', () => {
  it('ローズの回転は -heading だけで決まる', () => {
    expect(deriveHsiState(makeState({ headingDeg: 0 })).roseRotationDeg).toBe(-0);
    expect(deriveHsiState(makeState({ headingDeg: 90 })).roseRotationDeg).toBe(-90);
    expect(deriveHsiState(makeState({ headingDeg: 359 })).roseRotationDeg).toBe(-359);
  });

  it('コース層の回転は course だけで決まり、heading に影響されない', () => {
    for (const heading of [0, 90, 180, 270]) {
      const derived = deriveHsiState(makeState({ headingDeg: heading, courseDeg: 120 }));
      expect(derived.courseRotationDeg).toBe(120);
    }
  });

  it('機首から見たコースの向きを符号付きで持つ', () => {
    expect(deriveHsiState(makeState({ headingDeg: 45, courseDeg: 90 })).courseRelativeDeg).toBe(45);
    expect(deriveHsiState(makeState({ headingDeg: 90, courseDeg: 45 })).courseRelativeDeg).toBe(-45);
    expect(deriveHsiState(makeState({ headingDeg: 350, courseDeg: 10 })).courseRelativeDeg).toBe(20);
    expect(deriveHsiState(makeState({ headingDeg: 10, courseDeg: 350 })).interceptAngleDeg).toBe(20);
  });
});

describe('CDI', () => {
  it('コースの右側にいるとき、コースは左にあるので CDI は左を指す', () => {
    const derived = deriveHsiState(makeState({ aircraft: { x: 2, y: -20 }, courseDeg: 360 }));
    expect(derived.cdiDirection).toBe('LEFT');
    expect(derived.cdiDeflectionNormalized).toBeLessThan(0);
  });

  it('コースの左側にいるとき、CDI は右を指す', () => {
    const derived = deriveHsiState(makeState({ aircraft: { x: -2, y: -20 }, courseDeg: 360 }));
    expect(derived.cdiDirection).toBe('RIGHT');
    expect(derived.cdiDeflectionNormalized).toBeGreaterThan(0);
  });

  it('コース線の上では中央', () => {
    const derived = deriveHsiState(makeState({ aircraft: { x: 0, y: -20 }, courseDeg: 360 }));
    expect(derived.cdiDirection).toBe('CENTER');
    expect(derived.cdiDeflectionNormalized).toBe(0);
  });

  it('片側10度で振り切れる', () => {
    const aircraft = pointFromRadial(STATION, 180 + 10, DEFAULT_DISTANCE);
    const derived = deriveHsiState(makeState({ aircraft, courseDeg: 360 }));
    expect(derived.cdiAngularErrorDeg).toBeCloseTo(10, 6);
    expect(Math.abs(derived.cdiDeflectionNormalized)).toBeCloseTo(1, 6);

    const farther = pointFromRadial(STATION, 180 + 25, DEFAULT_DISTANCE);
    expect(
      Math.abs(deriveHsiState(makeState({ aircraft: farther, courseDeg: 360 })).cdiDeflectionNormalized),
    ).toBe(1);
  });

  it('Course を変えると CDI が変わる（Heading を変えても変わらないことの裏返し）', () => {
    const base = makeState({ aircraft: { x: 2, y: -20 } });
    expect(deriveHsiState({ ...base, courseDeg: 360 }).cdiDirection).toBe('LEFT');
    expect(deriveHsiState({ ...base, courseDeg: 180 }).cdiDirection).toBe('RIGHT');
  });
});

describe('TO / FROM', () => {
  it('局へ向かう側のコースなら TO', () => {
    const aircraft = pointFromRadial(STATION, 180, DEFAULT_DISTANCE);
    expect(deriveHsiState(makeState({ aircraft, courseDeg: 360 })).toFrom).toBe('TO');
  });

  it('局から離れる側のコースなら FROM', () => {
    const aircraft = pointFromRadial(STATION, 180, DEFAULT_DISTANCE);
    expect(deriveHsiState(makeState({ aircraft, courseDeg: 180 })).toFrom).toBe('FROM');
  });

  it('ちょうど直角では判定しない', () => {
    const aircraft = pointFromRadial(STATION, 180, DEFAULT_DISTANCE);
    const derived = deriveHsiState(makeState({ aircraft, courseDeg: 90 }));
    expect(derived.toFrom).toBe('OFF');
    expect(derived.toFromBoundary).toBe(true);
  });
});

describe('局の直上', () => {
  it('通常の判定を行わない', () => {
    const derived = deriveHsiState(makeState({ aircraft: { x: 0.2, y: 0.2 } }));
    expect(derived.isStationZone).toBe(true);
    expect(derived.radialDeg).toBeNull();
    expect(derived.toFrom).toBe('OFF');
    expect(derived.cdiDirection).toBe('OFF');
    expect(derived.interceptTrend).toBe('unknown');
  });

  it('直上でもローズの回転は生き続ける（計器が固まって見えないように）', () => {
    const derived = deriveHsiState(makeState({ aircraft: { x: 0.2, y: 0.2 }, headingDeg: 90 }));
    expect(derived.roseRotationDeg).toBe(-90);
  });
});

describe('Intercept の傾向（Lesson 4 の方向暗記防止）', () => {
  // コース360の右側（東側）にいる状態。CDIはどの機首でも「左」を指す。
  const base = makeState({ aircraft: { x: 2, y: -20 }, courseDeg: 360 });

  it('同じCDI表示でも、機首が違えば近づく／維持／離れるが変わる', () => {
    const cases = [
      { headingDeg: 315, expected: 'closing' },
      { headingDeg: 360, expected: 'holding' },
      { headingDeg: 45, expected: 'opening' },
    ] as const;

    for (const { headingDeg, expected } of cases) {
      const derived = deriveHsiState({ ...base, headingDeg });

      // CDIの表示はどれも同じ。ここが変わらないことが前提。
      expect(derived.cdiDirection).toBe('LEFT');
      expect(derived.interceptTrend).toBe(expected);
    }
  });

  it('コース上にいても、コースと平行でなければ離れていく', () => {
    const onCourse = makeState({ aircraft: { x: 0, y: -20 }, courseDeg: 360, headingDeg: 30 });
    const derived = deriveHsiState(onCourse);
    expect(derived.cdiDirection).toBe('CENTER');
    expect(derived.interceptTrend).toBe('opening');
  });

  it('風があるときは、機首ではなく実際に進む方向で判定する', () => {
    // 機首はコースと平行だが、東からの強い風で西へ流されている＝コースへ近づく。
    const drifting = deriveHsiState({
      ...base,
      headingDeg: 360,
      wind: { fromDeg: 90, speedKt: 20 },
    });

    expect(drifting.driftAngleDeg).toBeLessThan(0);
    expect(drifting.interceptTrend).toBe('closing');
  });
});

describe('computeInterceptTrend', () => {
  it('コース線までの横距離が縮むかどうかだけを見る', () => {
    // offset 正 = コースの右側。左へ進めば近づく。
    expect(computeInterceptTrend(2, 315, 360)).toBe('closing');
    expect(computeInterceptTrend(2, 45, 360)).toBe('opening');
    expect(computeInterceptTrend(-2, 45, 360)).toBe('closing');
    expect(computeInterceptTrend(-2, 315, 360)).toBe('opening');
  });

  it('コースと平行なら、向きが逆でも横距離は変わらない', () => {
    expect(computeInterceptTrend(2, 360, 360)).toBe('holding');
    expect(computeInterceptTrend(2, 180, 360)).toBe('holding');
  });
});
