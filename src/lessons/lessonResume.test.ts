import { describe, expect, it } from 'vitest';
import { LESSON1 } from './lesson1';
import { resolveStartStepIndex } from './lessonResume';

describe('resolveStartStepIndex', () => {
  it('記録がなければ先頭から', () => {
    expect(resolveStartStepIndex(LESSON1, undefined)).toBe(0);
    expect(resolveStartStepIndex(LESSON1, { status: 'not_started' })).toBe(0);
  });

  it('途中まで進んでいれば、その手順から再開する', () => {
    const target = LESSON1.steps[2];
    expect(
      resolveStartStepIndex(LESSON1, { status: 'in_progress', lastStepId: target.id }),
    ).toBe(2);
  });

  it('完了済みのレッスンは、もう一度先頭から見せる', () => {
    expect(
      resolveStartStepIndex(LESSON1, { status: 'completed', lastStepId: LESSON1.steps[3].id }),
    ).toBe(0);
  });

  it('手順を入れ替えて見つからないIDになっても、先頭に戻すだけで壊れない', () => {
    expect(
      resolveStartStepIndex(LESSON1, { status: 'in_progress', lastStepId: 'removed-step' }),
    ).toBe(0);
  });
});
