import { describe, expect, it } from 'vitest';
import { signedAngleDiff } from '../domain/hsi/angles';
import { COURSE_ALIGNED_EPS_DEG, WIND_SPEEDS_KT } from '../domain/hsi/constants';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import { requiredHeadingForCourse, solveWind } from '../domain/hsi/wind';
import { LESSON5 } from './lesson5';
import {
  buildStepState,
  countScoredQuizSteps,
  isQuizStep,
  type InteractStep,
} from './lessonTypes';

const QUIZZES = LESSON5.steps.filter(isQuizStep);

function interactStep(id: string): InteractStep {
  const step = LESSON5.steps.find(
    (candidate): candidate is InteractStep => candidate.kind === 'interact' && candidate.id === id,
  );
  if (!step) throw new Error(`動かす手順 ${id} が見つからない`);
  return step;
}

describe('Lesson 5 の作り', () => {
  it('手順IDが重複していない', () => {
    const ids = LESSON5.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('採点対象の問題数と合格の目安が食い違わない', () => {
    expect(LESSON5.passingScore).toBeLessThanOrEqual(countScoredQuizSteps(LESSON5));
  });

  it('どの手順でも局の直上には置かない', () => {
    for (const step of LESSON5.steps) {
      expect(deriveHsiState(buildStepState(step, LESSON5.baseState)).isStationZone).toBe(false);
    }
  });
});

/* --- 決まり1: まず無風から入る --- */
describe('無風から始める', () => {
  it('最初の2手順は無風', () => {
    for (const step of LESSON5.steps.slice(0, 2)) {
      expect(buildStepState(step, LESSON5.baseState).wind, `${step.id}`).toBeNull();
    }
  });

  it('無風のあいだは、機首と進む方向がぴったり同じ', () => {
    const noWindSteps = LESSON5.steps.filter(
      (step) => buildStepState(step, LESSON5.baseState).wind === null,
    );
    expect(noWindSteps.length).toBeGreaterThan(0);

    for (const step of noWindSteps) {
      const state = buildStepState(step, LESSON5.baseState);
      const derived = deriveHsiState(state);

      expect(derived.trackDeg, `${step.id}`).toBe(state.headingDeg);
      expect(derived.driftAngleDeg).toBe(0);
    }
  });

  it('無風で機首を回しても、進む方向は必ず一致し続ける', () => {
    const step = interactStep('no-wind-turn');
    const state = buildStepState(step, LESSON5.baseState);

    for (let heading = 0; heading < 360; heading += 15) {
      const derived = deriveHsiState({ ...state, headingDeg: heading });
      expect(derived.trackDeg, `機首 ${heading}`).toBe(heading);
    }
  });

  it('進む方向は最初から見せる（風が入ってから急に増やさない）', () => {
    for (const step of LESSON5.steps) {
      expect(step.visible.track, `${step.id}`).toBe(true);
    }
  });
});

/* --- 決まり2: 流される体験 --- */
describe('風で流されることを見せる', () => {
  it('風が入る手順では、機首はコースに合っているのに進む方向がずれる', () => {
    const step = LESSON5.steps.find((s) => s.id === 'wind-on')!;
    const state = buildStepState(step, LESSON5.baseState);
    const derived = deriveHsiState(state);

    // 機首はコースぴったり。
    expect(state.headingDeg).toBe(state.courseDeg);
    expect(derived.interceptAngleDeg).toBe(0);

    // それでも進む方向はずれている。
    expect(derived.trackCourseAngleDeg).toBeGreaterThan(COURSE_ALIGNED_EPS_DEG);
    expect(derived.driftAngleDeg).not.toBe(0);
  });

  it('横から当たる風ほど大きく流される', () => {
    const step = LESSON5.steps.find((s) => s.id === 'wind-change')!;
    const state = buildStepState(step, LESSON5.baseState);
    const speedKt = state.wind!.speedKt;

    const driftFor = (fromDeg: number) =>
      Math.abs(solveWind(state.headingDeg, state.tasKt, { fromDeg, speedKt }).driftAngleDeg);

    // 機首は 360。真正面(360)と真後ろ(180)からの風では流されない。
    expect(driftFor(360)).toBeCloseTo(0, 6);
    expect(driftFor(180)).toBeCloseTo(0, 6);
    // 真横(090)がいちばん大きい。
    expect(driftFor(90)).toBeGreaterThan(driftFor(45));
    expect(driftFor(45)).toBeGreaterThan(driftFor(10));
  });

  it('風が強いほど大きく流される', () => {
    const state = buildStepState(
      LESSON5.steps.find((s) => s.id === 'wind-on')!,
      LESSON5.baseState,
    );
    const driftFor = (speedKt: number) =>
      Math.abs(solveWind(state.headingDeg, state.tasKt, { fromDeg: 90, speedKt }).driftAngleDeg);

    expect(driftFor(30)).toBeGreaterThan(driftFor(20));
    expect(driftFor(20)).toBeGreaterThan(driftFor(10));
  });

  it('レッスンで使う風速は、風の操作で選べる値になっている', () => {
    // 選べない値にすると、風を変える画面でどのボタンも選ばれていない状態になる。
    for (const step of LESSON5.steps) {
      const wind = buildStepState(step, LESSON5.baseState).wind;
      if (wind === null) continue;
      expect(WIND_SPEEDS_KT, `${step.id}`).toContain(wind.speedKt);
    }
  });

  it('風を扱う手順では、上空図と風の表示を出す', () => {
    const windySteps = LESSON5.steps.filter(
      (step) => buildStepState(step, LESSON5.baseState).wind !== null,
    );

    for (const step of windySteps) {
      expect(step.visible.planView, `${step.id}`).toBe(true);
      expect(step.visible.wind, `${step.id}`).toBe(true);
    }
  });
});

/* --- 決まり3: 数値暗記教材にしない --- */
describe('数字を覚えさせる作りになっていない', () => {
  it('確認問題の選択肢に角度の数値が出てこない', () => {
    // 「何度振るか」を選ばせた時点で、暗記教材になってしまう。
    for (const step of QUIZZES) {
      for (const choice of step.choices) {
        expect(choice.label, `${step.id} / ${choice.label}`).not.toMatch(/\d+\s*°/);
        expect(choice.label).not.toMatch(/\d+\s*度/);
      }
    }
  });

  it('確認問題の答えは言葉で選ぶ形になっている', () => {
    for (const step of QUIZZES) {
      expect(step.choices.length).toBeGreaterThanOrEqual(3);
      expect(step.completionRule.value).toBe(step.correctChoiceId);
      expect(step.hints.length).toBeGreaterThan(0);
    }
  });

  it('偏流角そのものを答えさせる問題がない', () => {
    for (const step of QUIZZES) {
      expect(step.prompt).not.toContain('何度');
    }
  });
});

/* --- 決まり4: 風上へ向けて Track を保つ --- */
describe('風上へ機首を振る、という概念', () => {
  it('コースを保つのに必要な機首は、風が吹いてくる側にある', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'which-way')!;
    const state = buildStepState(step, LESSON5.baseState);
    const wind = state.wind!;

    const required = requiredHeadingForCourse(state.courseDeg, state.tasKt, wind);
    expect(required).not.toBeNull();

    // 直すべき向き（機首をずらす側）と、風が吹いてくる側が一致する。
    const correctionSide = Math.sign(signedAngleDiff(required!, state.courseDeg));
    const windSide = Math.sign(signedAngleDiff(wind.fromDeg, state.courseDeg));

    expect(correctionSide).toBe(windSide);
    expect(step.correctChoiceId).toBe('upwind');
  });

  it('機首を合わせただけでは離れていくことを問う手順がある', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'drifting-away')!;
    const derived = deriveHsiState(buildStepState(step, LESSON5.baseState));

    // 選択肢のIDを InterceptTrend と同じ綴りにしてあるので、そのまま比べられる。
    expect(step.correctChoiceId).toBe(derived.interceptTrend);
    expect(derived.interceptTrend).toBe('opening');
  });

  it('進む方向をコースに合わせる手順があり、出発点では合っていない', () => {
    const step = interactStep('hold-course');
    const tolerance = step.requiredTrackAlignmentDeg;
    expect(tolerance).toBeDefined();

    const derived = deriveHsiState(buildStepState(step, LESSON5.baseState));
    expect(derived.trackCourseAngleDeg).toBeGreaterThan(tolerance!);
  });

  it('合わせる条件を満たす機首が実際に存在し、そのとき機首は風上を向く', () => {
    const step = interactStep('hold-course');
    const state = buildStepState(step, LESSON5.baseState);
    const tolerance = step.requiredTrackAlignmentDeg!;

    const solutions: number[] = [];
    for (let heading = 0; heading < 360; heading += 1) {
      const derived = deriveHsiState({ ...state, headingDeg: heading });
      if (derived.trackCourseAngleDeg <= tolerance) solutions.push(heading);
    }

    // スライダーで見つけられる程度の幅があること。
    expect(solutions.length).toBeGreaterThanOrEqual(5);

    // どの解でも、機首はコースより風上側へ振れている。
    const windSide = Math.sign(signedAngleDiff(state.wind!.fromDeg, state.courseDeg));
    for (const heading of solutions) {
      const side = Math.sign(signedAngleDiff(heading, state.courseDeg));
      expect(side, `機首 ${heading}`).toBe(windSide);
    }
  });

  it('合わせたときは「距離は変わらない」と出る（表示の食い違いを作らない）', () => {
    const step = interactStep('hold-course');
    const state = buildStepState(step, LESSON5.baseState);
    const tolerance = step.requiredTrackAlignmentDeg!;

    const heading = requiredHeadingForCourse(state.courseDeg, state.tasKt, state.wind)!;
    const derived = deriveHsiState({ ...state, headingDeg: heading });

    expect(derived.trackCourseAngleDeg).toBeLessThanOrEqual(tolerance);
    expect(derived.interceptTrend).toBe('holding');
  });

  it('最後の2手順では、機首とコースが違ったままでよいことを見せる', () => {
    /*
     * 「機首はコースより風上」「それでも進む方向はコース」という状態を
     * 文章で言うだけでなく、実際にその状態を作って見せる。
     * 風速を変えると必要な機首も変わるので、ここで固定しておく。
     */
    for (const id of ['concept', 'summary']) {
      const step = LESSON5.steps.find((s) => s.id === id)!;
      const state = buildStepState(step, LESSON5.baseState);
      const derived = deriveHsiState(state);

      expect(state.headingDeg, id).not.toBe(state.courseDeg);
      expect(derived.trackCourseAngleDeg, id).toBeLessThanOrEqual(COURSE_ALIGNED_EPS_DEG);

      // 機首はコースより風上側にある。
      const headingSide = Math.sign(signedAngleDiff(state.headingDeg, state.courseDeg));
      const windSide = Math.sign(signedAngleDiff(state.wind!.fromDeg, state.courseDeg));
      expect(headingSide, id).toBe(windSide);
    }
  });
});

describe('Lesson 5 の状況表示', () => {
  it('確認問題では状況の要約を出さない', () => {
    for (const step of QUIZZES) {
      expect(step.situation, `${step.id}`).toBeFalsy();
    }
  });

  it('説明と動かす手順では状況の要約を出す', () => {
    for (const step of LESSON5.steps.filter((s) => s.kind === 'teach' || s.kind === 'interact')) {
      expect(step.situation, `${step.id}`).toBe(true);
    }
  });
});
