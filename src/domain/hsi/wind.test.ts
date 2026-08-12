import { describe, expect, it } from 'vitest';
import { normalize360 } from './angles';
import type { Wind } from './types';
import { requiredHeadingForCourse, solveWind } from './wind';

describe('solveWind', () => {
  it('無風では Heading と Track が一致する（Lesson 5 の出発点）', () => {
    for (const heading of [0, 45, 90, 180, 270, 359]) {
      const solution = solveWind(heading, 100, null);
      expect(solution.trackDeg).toBe(heading);
      expect(solution.driftAngleDeg).toBe(0);
      expect(solution.groundSpeedKt).toBe(100);
    }
  });

  it('東からの風では西へ流される', () => {
    const wind: Wind = { fromDeg: 90, speedKt: 20 };
    const solution = solveWind(360, 100, wind);

    // 北へ向いているのに、実際は少し西寄りに進む。
    expect(solution.trackDeg).toBeCloseTo(348.69, 2);
    expect(solution.driftAngleDeg).toBeCloseTo(-11.31, 2);
  });

  it('真後ろからの風では流されず、対地速度だけが増える', () => {
    const solution = solveWind(360, 100, { fromDeg: 180, speedKt: 20 });
    expect(solution.driftAngleDeg).toBeCloseTo(0, 6);
    expect(solution.groundSpeedKt).toBeCloseTo(120, 6);
  });
});

describe('requiredHeadingForCourse', () => {
  it('無風ではコースと同じ機首方位でよい', () => {
    expect(requiredHeadingForCourse(90, 100, null)).toBe(90);
  });

  it('求めた機首方位で飛ぶと、実際に進む方向がコースと一致する', () => {
    const cases: Array<{ course: number; wind: Wind }> = [
      { course: 360, wind: { fromDeg: 90, speedKt: 20 } },
      { course: 90, wind: { fromDeg: 180, speedKt: 25 } },
      { course: 215, wind: { fromDeg: 310, speedKt: 15 } },
      { course: 40, wind: { fromDeg: 5, speedKt: 30 } },
    ];

    for (const { course, wind } of cases) {
      const heading = requiredHeadingForCourse(course, 100, wind);
      expect(heading).not.toBeNull();

      const solution = solveWind(heading!, 100, wind);
      expect(solution.trackDeg).toBeCloseTo(normalize360(course), 6);
    }
  });

  it('横風が対気速度を超えて打ち消せないときは解なしとする', () => {
    expect(requiredHeadingForCourse(360, 20, { fromDeg: 90, speedKt: 60 })).toBeNull();
  });
});
