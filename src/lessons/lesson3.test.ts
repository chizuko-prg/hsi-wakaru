import { describe, expect, it } from 'vitest';
import { CDI_FULL_SCALE_DEG } from '../domain/hsi/constants';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import { LESSON3 } from './lesson3';
import { buildStepState, countScoredQuizSteps, isQuizStep } from './lessonTypes';

const QUIZZES = LESSON3.steps.filter(isQuizStep);

describe('Lesson 3 の作り', () => {
  it('手順IDが重複していない', () => {
    const ids = LESSON3.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('採点対象の問題数と合格の目安が食い違わない', () => {
    expect(LESSON3.passingScore).toBeLessThanOrEqual(countScoredQuizSteps(LESSON3));
  });
});

/*
 * このレッスンの肝。
 * 上空図は理解の補助と答え合わせであって、答えそのものを先に見せる道具ではない。
 */
describe('上空図は答えを先に見せない', () => {
  it('確認問題では上空図を出さない', () => {
    for (const step of QUIZZES) {
      expect(step.visible.planView, `${step.id} で出題中に上空図が出ている`).toBe(false);
    }
  });

  it('確認問題では、答えたあとにだけ上空図を足す', () => {
    for (const step of QUIZZES) {
      expect(step.revealVisible?.planView, `${step.id} に答え合わせの上空図がない`).toBe(true);
    }
  });

  it('答えたあとに足すのは上空図だけで、計器の部品は増やさない', () => {
    // 解いた瞬間に計器の見え方が変わると、何を読んで正解したのかが分からなくなる。
    for (const step of QUIZZES) {
      expect(Object.keys(step.revealVisible ?? {})).toEqual(['planView']);
    }
  });

  it('説明とまとめの手順では上空図を出す（理解の補助）', () => {
    for (const step of LESSON3.steps.filter((s) => s.kind === 'teach' || s.kind === 'summary')) {
      expect(step.visible.planView, `${step.id}`).toBe(true);
    }
  });

  it('計器を読むのに必要な部品は、出題中もすべて出ている', () => {
    for (const step of QUIZZES) {
      expect(step.visible.rose).toBe(true);
      expect(step.visible.courseArrow).toBe(true);
      expect(step.visible.cdi).toBe(true);
      expect(step.visible.toFrom).toBe(true);
    }
  });
});

describe('Lesson 3 の確認問題の正解は、判定ロジックの算出値と一致する', () => {
  it('コースが左右どちらにあるかの問題', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'which-side')!;
    const derived = deriveHsiState(buildStepState(step, LESSON3.baseState));

    // 選択肢のIDを CdiDirection と同じ綴りにしてあるので、そのまま比べられる。
    expect(step.correctChoiceId).toBe(derived.cdiDirection);
  });

  it('ずれの大きさの問題（ドット1つ＝5度）', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'how-far')!;
    const derived = deriveHsiState(buildStepState(step, LESSON3.baseState));

    const dotsPerFullScale = 2;
    const dots = Math.round(Math.abs(derived.cdiDeflectionNormalized) * dotsPerFullScale);

    expect(step.correctChoiceId).toBe(`dots-${dots}`);
    expect(CDI_FULL_SCALE_DEG / dotsPerFullScale).toBe(5);
  });

  it('局に近づくか離れるかの問題', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'to-or-from')!;
    const derived = deriveHsiState(buildStepState(step, LESSON3.baseState));

    expect(step.correctChoiceId).toBe(derived.toFrom);
    expect(derived.toFromBoundary).toBe(false);
  });
});

describe('Lesson 3 は機首の向きに影響されないことを見せる', () => {
  it('ずれの大きさを問う手順では、機首をコースからずらしてある', () => {
    // 機首とコースが同じだと「機首を見て答えた」のか区別がつかない。
    const step = QUIZZES.find((quiz) => quiz.id === 'how-far')!;
    const state = buildStepState(step, LESSON3.baseState);
    expect(state.headingDeg).not.toBe(state.courseDeg);
  });

  it('近づく／離れるを問う手順でも、機首はコースと別方向を向いている', () => {
    const step = QUIZZES.find((quiz) => quiz.id === 'to-or-from')!;
    const state = buildStepState(step, LESSON3.baseState);
    expect(state.headingDeg).not.toBe(state.courseDeg);
  });

  it('確認問題の答えは、機首をどれだけ回しても変わらない', () => {
    for (const step of QUIZZES) {
      const base = buildStepState(step, LESSON3.baseState);
      const reference = deriveHsiState(base);

      for (let heading = 0; heading < 360; heading += 30) {
        const derived = deriveHsiState({ ...base, headingDeg: heading });
        expect(derived.cdiDirection, `${step.id} / ${heading}`).toBe(reference.cdiDirection);
        expect(derived.cdiDeflectionNormalized).toBe(reference.cdiDeflectionNormalized);
        expect(derived.toFrom).toBe(reference.toFrom);
      }
    }
  });
});

describe('Lesson 3 の各手順の状態', () => {
  it('どの手順でも局の直上には置かない', () => {
    for (const step of LESSON3.steps) {
      expect(deriveHsiState(buildStepState(step, LESSON3.baseState)).isStationZone).toBe(false);
    }
  });

  it('CDIを見せる手順では、TO/FROMの判定境界に置かない', () => {
    // 境界では左右のずれを読み取れず、問題として成立しない。
    for (const step of LESSON3.steps) {
      expect(deriveHsiState(buildStepState(step, LESSON3.baseState)).toFromBoundary).toBe(false);
    }
  });
});
