import { describe, expect, it } from 'vitest';
import { formatBearing } from '../domain/hsi/angles';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import { LESSON1 } from './lesson1';
import { buildStepState, countScoredQuizSteps, isQuizStep } from './lessonTypes';

describe('Lesson 1 の作り', () => {
  it('手順IDが重複していない', () => {
    const ids = LESSON1.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('採点対象の問題数と合格の目安が食い違わない', () => {
    expect(LESSON1.passingScore).toBeLessThanOrEqual(countScoredQuizSteps(LESSON1));
  });

  it('最後の手順はまとめで終わる', () => {
    expect(LESSON1.steps.at(-1)?.kind).toBe('summary');
  });
});

describe('Lesson 1 は情報量を絞る', () => {
  it('CDI・TO/FROM・上空図・風・Trackは最後まで出さない', () => {
    for (const step of LESSON1.steps) {
      expect(step.visible.cdi, `${step.id} で CDI が出ている`).toBe(false);
      expect(step.visible.toFrom, `${step.id} で TO/FROM が出ている`).toBe(false);
      expect(step.visible.planView, `${step.id} で上空図が出ている`).toBe(false);
      expect(step.visible.track, `${step.id} で Track が出ている`).toBe(false);
      expect(step.visible.wind, `${step.id} で 風 が出ている`).toBe(false);
    }
  });

  it('コンパスローズは全手順で出す', () => {
    for (const step of LESSON1.steps) {
      expect(step.visible.rose).toBe(true);
    }
  });

  it('目盛りから読み取ってもらう問題では、答えになる数値窓を出さない', () => {
    const step = LESSON1.steps.find((s) => s.id === 'read-heading');
    expect(step).toBeDefined();
    expect(step!.visible.headingReadout).toBe(false);
  });

  it('読み取り問題以外では、機首の数値窓を出す', () => {
    for (const step of LESSON1.steps.filter((s) => s.id !== 'read-heading')) {
      expect(step.visible.headingReadout, `${step.id}`).toBe(true);
    }
  });

  it('Course は後半で登場する（前半では出さない）', () => {
    const firstWithCourse = LESSON1.steps.findIndex((step) => step.visible.courseArrow);

    expect(firstWithCourse).toBeGreaterThan(0);
    // 登場したあとは最後まで出したままにする。
    for (const step of LESSON1.steps.slice(firstWithCourse)) {
      expect(step.visible.courseArrow).toBe(true);
    }
  });

  it('覚える用語は Heading と Course の2つだけ', () => {
    const terms = LESSON1.steps.flatMap((step) => (step.kind === 'teach' ? (step.terms ?? []) : []));

    expect(terms.map((term) => term.abbr)).toEqual(['Heading', 'Course']);
  });

  it('風は使わない', () => {
    for (const step of LESSON1.steps) {
      const state = buildStepState(step, LESSON1.baseState);
      expect(state.wind).toBeNull();
    }
  });
});

describe('Lesson 1 の確認問題', () => {
  it('正解の選択肢が必ず選択肢の中にある', () => {
    for (const step of LESSON1.steps.filter(isQuizStep)) {
      expect(step.choices.map((choice) => choice.id)).toContain(step.correctChoiceId);
      expect(step.completionRule.value).toBe(step.correctChoiceId);
    }
  });

  it('間違えたときの手がかりが用意されている', () => {
    for (const step of LESSON1.steps.filter(isQuizStep)) {
      expect(step.hints.length).toBeGreaterThan(0);
    }
  });

  it('機首方位を読む問題の正解は、判定ロジックの算出値と一致する', () => {
    const step = LESSON1.steps.filter(isQuizStep).find((quiz) => quiz.id === 'read-heading');
    expect(step).toBeDefined();

    // 正解をレッスンデータに直接書いた値としてではなく、
    // その手順の状態から計算した値として確かめる。
    const state = buildStepState(step!, LESSON1.baseState);
    expect(step!.correctChoiceId).toBe(formatBearing(state.headingDeg));
  });
});

describe('Lesson 1 の各手順の状態', () => {
  it('Course を見せる手順では、機首とコースが別の値になっている', () => {
    // 「2つは別もの」を示す手順で同じ値を出してしまうと、違いが見えない。
    for (const step of LESSON1.steps.filter((s) => s.visible.courseArrow)) {
      const state = buildStepState(step, LESSON1.baseState);
      expect(state.headingDeg).not.toBe(state.courseDeg);
    }
  });

  it('どの手順でも局の直上には置かない（計器が判定なしにならないように）', () => {
    for (const step of LESSON1.steps) {
      const derived = deriveHsiState(buildStepState(step, LESSON1.baseState));
      expect(derived.isStationZone, `${step.id}`).toBe(false);
    }
  });

  it('ローズの回転は必ず -heading になる', () => {
    for (const step of LESSON1.steps) {
      const state = buildStepState(step, LESSON1.baseState);
      const derived = deriveHsiState(state);
      expect(derived.roseRotationDeg).toBe(-state.headingDeg);
    }
  });
});
