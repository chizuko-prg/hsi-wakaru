import { describe, expect, it } from 'vitest';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import { LESSON4 } from './lesson4';
import {
  buildCaseState,
  buildStepState,
  countScoredQuizSteps,
  isQuizStep,
  type CompareStep,
  type InteractStep,
} from './lessonTypes';

const QUIZZES = LESSON4.steps.filter(isQuizStep);
const COMPARE = LESSON4.steps.find((step): step is CompareStep => step.kind === 'compare');

function interactStep(id: string): InteractStep {
  const step = LESSON4.steps.find(
    (candidate): candidate is InteractStep => candidate.kind === 'interact' && candidate.id === id,
  );
  if (!step) throw new Error(`動かす手順 ${id} が見つからない`);
  return step;
}

describe('Lesson 4 の作り', () => {
  it('手順IDが重複していない', () => {
    const ids = LESSON4.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('採点対象の問題数と合格の目安が食い違わない', () => {
    expect(LESSON4.passingScore).toBeLessThanOrEqual(countScoredQuizSteps(LESSON4));
  });

  it('どの手順でも局の直上には置かない', () => {
    for (const step of LESSON4.steps) {
      expect(deriveHsiState(buildStepState(step, LESSON4.baseState)).isStationZone).toBe(false);
    }
  });
});

/* --- 決まり1: 上空図と計器を必ず同時に出す --- */
describe('図と計器を同時に見せる', () => {
  it('全手順で上空図を出す', () => {
    for (const step of LESSON4.steps) {
      expect(step.visible.planView, `${step.id} で上空図が出ていない`).toBe(true);
    }
  });

  it('全手順で計器の読み取りに必要な部品を出す', () => {
    for (const step of LESSON4.steps) {
      expect(step.visible.rose, `${step.id}`).toBe(true);
      expect(step.visible.courseArrow, `${step.id}`).toBe(true);
      expect(step.visible.cdi, `${step.id}`).toBe(true);
    }
  });

  it('確認問題でも上空図を隠さない（Lesson 3 とは狙いが違う）', () => {
    // Lesson 3 は「計器を読む」練習なので出題中は図を隠した。
    // Lesson 4 は「図と計器を重ねて状況を判断する」練習なので、両方を出したままにする。
    for (const step of QUIZZES) {
      expect(step.visible.planView, `${step.id}`).toBe(true);
      expect(step.revealVisible, `${step.id} に後出しの部品がある`).toBeUndefined();
    }
  });

  it('確認問題では状況の要約を出さない', () => {
    // 状況表示には「いま近づいているか」がそのまま書いてある。
    // 出題中に見せてしまうと、それが答えになってしまう。
    for (const step of QUIZZES) {
      expect(step.situation, `${step.id} で状況の要約が出ている`).toBeFalsy();
    }
  });

  it('説明と動かす手順では状況の要約を出す', () => {
    for (const step of LESSON4.steps.filter((s) => s.kind === 'interact')) {
      expect(step.situation, `${step.id}`).toBe(true);
    }
  });
});

/* --- 決まり2: 同じCDIでも起きていることが違う --- */
describe('同じCDI表示で、機首だけが違う3つを並べる', () => {
  it('見くらべの手順がある', () => {
    expect(COMPARE).toBeDefined();
    expect(COMPARE!.cases.length).toBe(3);
  });

  it('3つとも自機の位置が同じ', () => {
    const positions = COMPARE!.cases.map((lessonCase) => {
      const state = buildCaseState(lessonCase, LESSON4.baseState);
      return `${state.aircraft.x.toFixed(6)},${state.aircraft.y.toFixed(6)}`;
    });

    expect(new Set(positions).size).toBe(1);
  });

  it('3つともCDIの振れ方がまったく同じ', () => {
    const readings = COMPARE!.cases.map((lessonCase) => {
      const derived = deriveHsiState(buildCaseState(lessonCase, LESSON4.baseState));
      return `${derived.cdiDirection}/${derived.cdiDeflectionNormalized}`;
    });

    // ここが同じでないと、このレッスンの主張が成り立たない。
    expect(new Set(readings).size).toBe(1);
  });

  it('3つとも機首が違い、起きていることも3通りに分かれる', () => {
    const headings = COMPARE!.cases.map(
      (lessonCase) => buildCaseState(lessonCase, LESSON4.baseState).headingDeg,
    );
    const trends = COMPARE!.cases.map(
      (lessonCase) => deriveHsiState(buildCaseState(lessonCase, LESSON4.baseState)).interceptTrend,
    );

    expect(new Set(headings).size).toBe(3);
    expect(new Set(trends)).toEqual(new Set(['closing', 'holding', 'opening']));
  });

  it('見くらべに出す値は「いま」を必ず含む', () => {
    for (const lessonCase of COMPARE!.cases) {
      expect(lessonCase.readouts).toContain('trend');
      expect(lessonCase.readouts).toContain('cdi');
    }
  });
});

/* --- 決まり3: 確認問題はCDIの左右だけでは答えられない --- */
describe('確認問題はCDIの左右だけでは決まらない', () => {
  it('正解は判定ロジックの算出値と一致する', () => {
    for (const step of QUIZZES) {
      const derived = deriveHsiState(buildStepState(step, LESSON4.baseState));
      // 選択肢のIDを InterceptTrend と同じ綴りにしてあるので、そのまま比べられる。
      expect(step.correctChoiceId, `${step.id}`).toBe(derived.interceptTrend);
      expect(step.completionRule.value).toBe(step.correctChoiceId);
      expect(step.hints.length).toBeGreaterThan(0);
    }
  });

  it('CDIがまったく同じで答えが逆になる問題の組がある', () => {
    const away = QUIZZES.find((quiz) => quiz.id === 'trend-away')!;
    const toward = QUIZZES.find((quiz) => quiz.id === 'trend-in')!;

    const awayDerived = deriveHsiState(buildStepState(away, LESSON4.baseState));
    const towardDerived = deriveHsiState(buildStepState(toward, LESSON4.baseState));

    // CDIの表示は同じ。
    expect(awayDerived.cdiDirection).toBe(towardDerived.cdiDirection);
    expect(awayDerived.cdiDeflectionNormalized).toBe(towardDerived.cdiDeflectionNormalized);

    // それでも答えは逆。CDIの左右を覚えるだけでは両方には正解できない。
    expect(away.correctChoiceId).toBe('opening');
    expect(toward.correctChoiceId).toBe('closing');
  });

  it('どの問題でも機首とコースが同じ向きになっていない', () => {
    // 同じ向きだと、機首を見るだけで答えが出てしまう。
    for (const step of QUIZZES) {
      const derived = deriveHsiState(buildStepState(step, LESSON4.baseState));
      expect(derived.interceptAngleDeg, `${step.id}`).toBeGreaterThan(0);
    }
  });
});

/* --- 決まり4: CDI中央で終わらせず、Tracking へつなげる --- */
describe('捕まえたあとの流れがある', () => {
  it('CDIが中央でも終わりではないことを問う手順がある', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'centered-then')!;
    const derived = deriveHsiState(buildStepState(step, LESSON4.baseState));

    expect(derived.cdiDirection).toBe('CENTER');
    // 中央にいても、機首がコースと違えば横切って出ていく。
    expect(derived.interceptTrend).toBe('opening');
    expect(step.correctChoiceId).toBe('opening');
  });

  it('近づく向きを自分で作る手順がある', () => {
    const step = interactStep('find-intercept');
    expect(step.requiredTrend).toBe('closing');

    // 出発点は離れていく向き。動かさないと条件を満たさない。
    const derived = deriveHsiState(buildStepState(step, LESSON4.baseState));
    expect(derived.interceptTrend).toBe('opening');
  });

  it('コースへ機首を合わせる手順があり、出発点では合っていない', () => {
    const step = interactStep('align-course');
    const tolerance = step.requiredCourseAlignmentDeg;
    expect(tolerance).toBeDefined();

    const derived = deriveHsiState(buildStepState(step, LESSON4.baseState));
    expect(derived.interceptAngleDeg).toBeGreaterThan(tolerance!);
  });

  it('合わせたと判定される向きでは、必ず「距離は変わらない」と出る', () => {
    /*
     * 「機首はコースに合っています」と出ているのに
     * 「コースから離れている」と同時に出る、という食い違いを防ぐ。
     * しきい値がずれると起きるので、境界のすぐ内側で確かめる。
     */
    const step = interactStep('align-course');
    const state = buildStepState(step, LESSON4.baseState);
    const tolerance = step.requiredCourseAlignmentDeg!;

    for (const offset of [0, tolerance / 2, tolerance, -tolerance]) {
      const derived = deriveHsiState({ ...state, headingDeg: state.courseDeg + offset });

      expect(derived.interceptAngleDeg).toBeLessThanOrEqual(tolerance);
      expect(derived.interceptTrend, `機首を ${offset}° ずらしたとき`).toBe('holding');
    }
  });

  it('合わせる手順は、真逆を向いただけでは終われない', () => {
    // 平行というだけの判定にすると、逆向きでも通ってしまう。
    const step = interactStep('align-course');
    const state = buildStepState(step, LESSON4.baseState);
    const tolerance = step.requiredCourseAlignmentDeg!;

    const reciprocal = deriveHsiState({ ...state, headingDeg: state.courseDeg + 180 });
    expect(reciprocal.interceptAngleDeg).toBeGreaterThan(tolerance);

    const aligned = deriveHsiState({ ...state, headingDeg: state.courseDeg });
    expect(aligned.interceptAngleDeg).toBeLessThanOrEqual(tolerance);
  });

  it('Lesson 5 へつながる手順で終わる', () => {
    expect(LESSON4.nextLessonId).toBe('lesson5');
    expect(LESSON4.steps.at(-1)?.kind).toBe('summary');
    expect(LESSON4.completion.nextPreview).toContain('風');
  });
});
