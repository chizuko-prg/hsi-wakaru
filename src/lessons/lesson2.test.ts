import { describe, expect, it } from 'vitest';
import { formatBearing } from '../domain/hsi/angles';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import { LESSON2 } from './lesson2';
import { buildStepState, countScoredQuizSteps, isQuizStep } from './lessonTypes';

describe('Lesson 2 の作り', () => {
  it('手順IDが重複していない', () => {
    const ids = LESSON2.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('採点対象の問題数と合格の目安が食い違わない', () => {
    expect(LESSON2.passingScore).toBeLessThanOrEqual(countScoredQuizSteps(LESSON2));
  });

  it('CDI・TO/FROM・上空図はまだ出さない', () => {
    for (const step of LESSON2.steps) {
      expect(step.visible.cdi, `${step.id}`).toBe(false);
      expect(step.visible.toFrom, `${step.id}`).toBe(false);
      expect(step.visible.planView, `${step.id}`).toBe(false);
    }
  });
});

describe('Lesson 2 は両方のスライダーで独立を体験させる', () => {
  const interactSteps = LESSON2.steps.filter((step) => step.kind === 'interact');

  it('動かす手順が3つある（Headingだけ・Courseだけ・両方）', () => {
    expect(interactSteps.map((step) => step.controls)).toEqual([
      ['heading'],
      ['course'],
      ['heading', 'course'],
    ]);
  });

  it('片方だけ動かす手順でも、両方の値を数字で見くらべられる', () => {
    // 「変わらなかった」ことは計器の見た目だけでは気づきにくいので、
    // 動かせない側も必ず並べて出す。
    for (const step of interactSteps) {
      expect(step.watch, `${step.id}`).toEqual(['heading', 'course']);
    }
  });

  it('動かす手順では、機首とコースの両方の数値窓を出す', () => {
    for (const step of interactSteps) {
      expect(step.visible.headingReadout, `${step.id}`).toBe(true);
      expect(step.visible.courseReadout, `${step.id}`).toBe(true);
    }
  });

  it('動かす手順の出発点では、機首とコースが違う値になっている', () => {
    for (const step of interactSteps) {
      const state = buildStepState(step, LESSON2.baseState);
      expect(state.headingDeg, `${step.id}`).not.toBe(state.courseDeg);
    }
  });
});

describe('Lesson 2 の確認問題', () => {
  it('正解の選択肢が必ず選択肢の中にあり、完了条件と一致する', () => {
    for (const step of LESSON2.steps.filter(isQuizStep)) {
      expect(step.choices.map((choice) => choice.id)).toContain(step.correctChoiceId);
      expect(step.completionRule.value).toBe(step.correctChoiceId);
      expect(step.hints.length).toBeGreaterThan(0);
    }
  });

  it('2つとも読む問題では、答えになる数値窓を両方とも隠す', () => {
    const step = LESSON2.steps.find((s) => s.id === 'read-both');
    expect(step).toBeDefined();
    expect(step!.visible.headingReadout).toBe(false);
    expect(step!.visible.courseReadout).toBe(false);
  });

  it('2つとも読む問題の正解は、その手順の状態から組み立てた値と一致する', () => {
    const step = LESSON2.steps.filter(isQuizStep).find((quiz) => quiz.id === 'read-both');
    const state = buildStepState(step!, LESSON2.baseState);

    expect(step!.correctChoiceId).toBe(
      `${formatBearing(state.headingDeg)}/${formatBearing(state.courseDeg)}`,
    );
  });
});

describe('Lesson 2 の各手順の状態', () => {
  it('コース層の回転は course だけで決まり、heading に影響されない', () => {
    for (const step of LESSON2.steps) {
      const state = buildStepState(step, LESSON2.baseState);
      expect(deriveHsiState(state).courseRotationDeg).toBe(state.courseDeg);
    }
  });

  it('どの手順でも局の直上には置かない', () => {
    for (const step of LESSON2.steps) {
      expect(deriveHsiState(buildStepState(step, LESSON2.baseState)).isStationZone).toBe(false);
    }
  });
});
