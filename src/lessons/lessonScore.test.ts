import { describe, expect, it } from 'vitest';
import { LESSON1 } from './lesson1';
import { attemptOf, countCorrectOnFirstTry, withAnswer, type QuizAttempts } from './lessonScore';
import { scoredQuizSteps } from './lessonTypes';

const [FIRST, SECOND] = scoredQuizSteps(LESSON1);

describe('withAnswer', () => {
  it('最初の回答で正解したら、初回正解として数える', () => {
    const attempts = withAnswer({}, FIRST.id, FIRST.correctChoiceId, true);
    expect(attemptOf(attempts, FIRST.id).solved).toBe(true);
    expect(attemptOf(attempts, FIRST.id).correctOnFirstTry).toBe(true);
  });

  it('間違えてから正解した場合は、初回正解には数えない', () => {
    let attempts: QuizAttempts = withAnswer({}, FIRST.id, 'wrong', false);
    expect(attemptOf(attempts, FIRST.id).wrongCount).toBe(1);
    expect(attemptOf(attempts, FIRST.id).solved).toBe(false);

    attempts = withAnswer(attempts, FIRST.id, FIRST.correctChoiceId, true);
    expect(attemptOf(attempts, FIRST.id).solved).toBe(true);
    expect(attemptOf(attempts, FIRST.id).correctOnFirstTry).toBe(false);
  });

  it('間違えるたびに回数が増える（段階ヒントの段数になる）', () => {
    let attempts: QuizAttempts = {};
    for (let i = 1; i <= 3; i += 1) {
      attempts = withAnswer(attempts, FIRST.id, 'wrong', false);
      expect(attemptOf(attempts, FIRST.id).wrongCount).toBe(i);
    }
  });

  it('正解したあとの回答は記録を変えない', () => {
    const solved = withAnswer({}, FIRST.id, FIRST.correctChoiceId, true);
    const after = withAnswer(solved, FIRST.id, 'wrong', false);
    expect(after).toBe(solved);
  });
});

describe('countCorrectOnFirstTry', () => {
  it('採点対象の問題だけを数える', () => {
    let attempts: QuizAttempts = {};
    expect(countCorrectOnFirstTry(LESSON1, attempts)).toBe(0);

    attempts = withAnswer(attempts, FIRST.id, FIRST.correctChoiceId, true);
    expect(countCorrectOnFirstTry(LESSON1, attempts)).toBe(1);

    // 2問目は一度間違えてから正解する。
    attempts = withAnswer(attempts, SECOND.id, 'wrong', false);
    attempts = withAnswer(attempts, SECOND.id, SECOND.correctChoiceId, true);
    expect(countCorrectOnFirstTry(LESSON1, attempts)).toBe(1);
  });
});
